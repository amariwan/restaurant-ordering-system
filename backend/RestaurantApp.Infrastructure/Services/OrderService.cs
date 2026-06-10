using AutoMapper;
using Microsoft.EntityFrameworkCore;
using RestaurantApp.Core.DTOs.Common;
using RestaurantApp.Core.DTOs.Orders;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;
using RestaurantApp.Core.Exceptions;
using RestaurantApp.Core.Extensions;
using RestaurantApp.Core.Interfaces;
using RestaurantApp.Infrastructure.Data;

namespace RestaurantApp.Infrastructure.Services;

public class OrderService : IOrderService
{
    private static readonly HashSet<OrderStatus> ActiveStatuses = new()
    {
        OrderStatus.Pending,
        OrderStatus.Preparing,
        OrderStatus.Ready,
    };

    private readonly AppDbContext _db;
    private readonly IOrderNotifier _notifier;
    private readonly IMapper _mapper;

    public OrderService(AppDbContext db, IOrderNotifier notifier, IMapper mapper)
    {
        _db = db;
        _notifier = notifier;
        _mapper = mapper;
    }

    public async Task<PaginatedResponse<OrderDto>> GetAllAsync(OrderStatus? status = null, int? tableId = null, int page = 1, int pageSize = 20)
    {
        var query = _db.Orders
            .Include(o => o.Table)
            .Include(o => o.Items)
                .ThenInclude(oi => oi.MenuItem)
            .Include(o => o.Payments)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(o => o.Status == status.Value);
        if (tableId.HasValue)
            query = query.Where(o => o.TableId == tableId.Value);

        var totalCount = await query.CountAsync();

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        foreach (var order in orders)
        {
            order.PaymentStatus = ComputePaymentStatus(order);
        }

        return new PaginatedResponse<OrderDto>
        {
            Items = _mapper.Map<IEnumerable<OrderDto>>(orders),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<OrderDto> GetByIdAsync(int id)
    {
        var order = await _db.Orders
            .Include(o => o.Table)
            .Include(o => o.Items)
                .ThenInclude(oi => oi.MenuItem)
            .Include(o => o.Payments)
            .FirstOrDefaultAsync(o => o.Id == id)
            ?? throw new NotFoundException($"Order {id} not found");

        order.PaymentStatus = ComputePaymentStatus(order);
        return _mapper.Map<OrderDto>(order);
    }

    public async Task<OrderDto> CreateAsync(OrderRequest request, int? userId)
    {
        if (request.Items == null || !request.Items.Any())
            throw new BadRequestException("At least one item is required to create an order");

        var table = await _db.Tables.FindAsync(request.TableId)
            ?? throw new NotFoundException($"Table {request.TableId} not found");

        var activeCount = await _db.Orders
            .Where(o => o.TableId == request.TableId && ActiveStatuses.Contains(o.Status))
            .CountAsync();

        if (activeCount > 0)
            throw new ConflictException($"Table {request.TableId} already has an active order");

        var order = new Order
        {
            TableId = request.TableId,
            UserId = userId,
            Status = OrderStatus.Pending,
            PaymentStatus = PaymentStatus.Unpaid
        };

        foreach (var itemReq in request.Items)
        {
            if (itemReq.Quantity <= 0)
                throw new BadRequestException($"Quantity for MenuItem {itemReq.MenuItemId} must be positive");

            var menuItem = await _db.MenuItems.FindAsync(itemReq.MenuItemId)
                ?? throw new NotFoundException($"MenuItem {itemReq.MenuItemId} not found");

            order.Items.Add(new OrderItem
            {
                MenuItemId = itemReq.MenuItemId,
                Quantity = itemReq.Quantity,
                PriceAtOrder = menuItem.Price,
                Note = itemReq.Note
            });
        }

        _db.Orders.Add(order);
        table.Status = TableStatus.Occupied;
        await _db.SaveChangesAsync();

        var loaded = await _db.Orders
            .Include(o => o.Table)
            .Include(o => o.Items)
                .ThenInclude(oi => oi.MenuItem)
            .FirstOrDefaultAsync(o => o.Id == order.Id);

        if (loaded == null)
            throw new NotFoundException($"Order {order.Id} not found after creation");

        var dto = _mapper.Map<OrderDto>(loaded);
        await _notifier.NotifyNewOrder(dto);

        return dto;
    }

    public async Task<OrderDto> UpdateStatusAsync(int id, OrderStatus status, UserRole userRole)
    {
        var order = await _db.Orders
            .Include(o => o.Table)
            .FirstOrDefaultAsync(o => o.Id == id)
            ?? throw new NotFoundException($"Order {id} not found");

        order.Status.EnsureTransitionAllowed(status);

        if (userRole == UserRole.Waiter && status is not (OrderStatus.Served or OrderStatus.Cancelled))
            throw new ForbiddenException("Waiter can only set Served or Cancelled");

        if (userRole == UserRole.Kitchen && status is not (OrderStatus.Preparing or OrderStatus.Ready))
            throw new ForbiddenException("Kitchen can only set Preparing or Ready");

        order.Status = status;
        order.UpdatedAt = DateTime.UtcNow;

        if (status == OrderStatus.Served && order.Table != null)
            order.Table.Status = TableStatus.Free;

        if (status == OrderStatus.Cancelled && order.Table != null)
        {
            var otherActiveOrders = await _db.Orders
                .CountAsync(o => o.TableId == order.TableId
                    && ActiveStatuses.Contains(o.Status)
                    && o.Id != order.Id);

            if (otherActiveOrders == 0)
                order.Table.Status = TableStatus.Free;
        }

        await _db.SaveChangesAsync();

        var dto = await GetByIdAsync(id);
        await _notifier.NotifyOrderStatusChanged(order.Id, status);

        return dto;
    }

    public async Task<OrderItemDto> AddItemAsync(int orderId, OrderItemRequest request)
    {
        if (request.Quantity <= 0)
            throw new BadRequestException("Quantity must be positive");

        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new NotFoundException($"Order {orderId} not found");

        if (!order.Status.IsModifiable())
            throw new ForbiddenException("Items can only be added to Pending or Preparing orders");

        var menuItem = await _db.MenuItems.FindAsync(request.MenuItemId)
            ?? throw new NotFoundException($"MenuItem {request.MenuItemId} not found");

        var item = new OrderItem
        {
            OrderId = orderId,
            MenuItemId = request.MenuItemId,
            Quantity = request.Quantity,
            PriceAtOrder = menuItem.Price,
            Note = request.Note
        };

        order.Items.Add(item);
        await _db.SaveChangesAsync();

        return new OrderItemDto
        {
            Id = item.Id,
            MenuItemId = item.MenuItemId,
            MenuItemName = menuItem.NameEn,
            MenuItemNameKu = menuItem.NameKu,
            Price = item.PriceAtOrder,
            Quantity = item.Quantity,
            Note = item.Note
        };
    }

    public async Task RemoveItemAsync(int orderId, int itemId)
    {
        var order = await _db.Orders
            .Include(o => o.Table)
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new NotFoundException($"Order {orderId} not found");

        if (!order.Status.IsModifiable())
            throw new ForbiddenException("Items can only be removed from Pending or Preparing orders");

        var item = order.Items.FirstOrDefault(i => i.Id == itemId)
            ?? throw new NotFoundException($"OrderItem {itemId} not found");

        order.Items.Remove(item);

        if (!order.Items.Any() && order.Table != null && order.Table.Status == TableStatus.Occupied)
            order.Table.Status = TableStatus.Free;

        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id)
            ?? throw new NotFoundException($"Order {id} not found");

        if (order.Status != OrderStatus.Pending)
            throw new ForbiddenException("Only Pending orders can be deleted");

        _db.Orders.Remove(order);
        await _db.SaveChangesAsync();
    }

    private static PaymentStatus ComputePaymentStatus(Order order)
    {
        var total = order.Items.Sum(i => i.PriceAtOrder * i.Quantity);
        if (total <= 0m) return PaymentStatus.Unpaid;

        var paid = order.Payments?.Sum(p => p.Amount) ?? 0m;

        if (paid >= total - 0.01m)
            return PaymentStatus.Paid;
        if (paid > 0m)
            return PaymentStatus.PartiallyPaid;
        return PaymentStatus.Unpaid;
    }
}
