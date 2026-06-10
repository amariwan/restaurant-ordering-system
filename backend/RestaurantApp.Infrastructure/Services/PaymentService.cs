using Microsoft.EntityFrameworkCore;
using AutoMapper;
using RestaurantApp.Core.DTOs.Payments;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;
using RestaurantApp.Core.Exceptions;
using RestaurantApp.Core.Interfaces;
using RestaurantApp.Infrastructure.Data;

namespace RestaurantApp.Infrastructure.Services;

public class PaymentService : IPaymentService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public PaymentService(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<PaymentDto> CreateAsync(int orderId, PaymentRequest request)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .ThenInclude(oi => oi.MenuItem)
            .FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new NotFoundException($"Order {orderId} not found");

        if (order.Status == OrderStatus.Served || order.Status == OrderStatus.Cancelled)
            throw new BadRequestException("Cannot add payments to a served or cancelled order");

        var total = order.Items.Sum(i => i.PriceAtOrder * i.Quantity);
        var alreadyPaid = await _db.Payments
            .Where(p => p.OrderId == orderId && p.Status != PaymentStatus.Unpaid)
            .SumAsync(p => p.Amount);

        var remaining = total - alreadyPaid;
        
        if (remaining <= 0m)
            throw new BadRequestException("This order is already fully paid");

        if (request.Amount > remaining + 0.01m)
            throw new ConflictException($"Payment amount exceeds remaining balance ({remaining:F2})");

        if (request.Amount <= 0m)
            throw new BadRequestException("Payment amount must be greater than zero");

        var payment = new Payment
        {
            OrderId = orderId,
            Amount = request.Amount,
            Method = request.Method,
            Status = PaymentStatus.Paid,
            PaidAt = DateTime.UtcNow
        };

        _db.Payments.Add(payment);
        await _db.SaveChangesAsync();

        return _mapper.Map<PaymentDto>(payment);
    }

    public async Task<IEnumerable<PaymentDto>> GetAllByOrderIdAsync(int orderId)
    {
        var payments = await _db.Payments
            .Where(p => p.OrderId == orderId)
            .OrderByDescending(p => p.PaidAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<PaymentDto>>(payments);
    }
}
