using AutoMapper;
using Microsoft.EntityFrameworkCore;
using RestaurantApp.Core.DTOs.Receipts;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;
using RestaurantApp.Core.Exceptions;
using RestaurantApp.Core.Interfaces;
using RestaurantApp.Infrastructure.Data;

namespace RestaurantApp.Infrastructure.Services;

public class ReceiptService : IReceiptService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public ReceiptService(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<ReceiptDto> GenerateReceiptAsync(int orderId)
    {
        var order = await _db.Orders
            .Include(o => o.Items).ThenInclude(i => i.MenuItem)
            .Include(o => o.Payments)
            .Include(o => o.Table)
            .FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new NotFoundException($"Order {orderId} not found");

        var totalAmount = order.Items.Sum(i => i.PriceAtOrder * i.Quantity);
        var paidAmount = order.Payments.Where(p => p.Status == PaymentStatus.Paid).Sum(p => p.Amount);
        var paymentMethods = string.Join(", ",
            order.Payments.Where(p => p.Status == PaymentStatus.Paid)
                .Select(p => p.Method.ToString()).Distinct());

        var existing = await _db.Receipts.FirstOrDefaultAsync(r => r.OrderId == orderId);
        if (existing != null)
        {
            existing.TotalAmount = totalAmount;
            existing.PaidAmount = paidAmount;
            existing.PaymentMethods = paymentMethods;
            existing.GeneratedAt = DateTime.UtcNow;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            var receipt = new Receipt
            {
                OrderId = orderId,
                TotalAmount = totalAmount,
                PaidAmount = paidAmount,
                PaymentMethods = paymentMethods,
                TaxAmount = 0,
                TipAmount = 0,
                GeneratedAt = DateTime.UtcNow,
            };
            _db.Receipts.Add(receipt);
            await _db.SaveChangesAsync();
            receipt.ReceiptNumber = $"R-{DateTime.UtcNow:yyyyMMdd}-{receipt.Id:D5}";
        }

        await _db.SaveChangesAsync();

        return await BuildReceiptDto(orderId);
    }

    public async Task<ReceiptDto> GetByIdAsync(int id)
    {
        var receipt = await _db.Receipts
            .Include(r => r.Order).ThenInclude(o => o.Items).ThenInclude(i => i.MenuItem)
            .Include(r => r.Order).ThenInclude(o => o.Table)
            .FirstOrDefaultAsync(r => r.Id == id)
            ?? throw new NotFoundException($"Receipt {id} not found");

        return BuildReceiptDto(receipt);
    }

    public async Task<ReceiptDto?> GetByOrderIdAsync(int orderId)
    {
        var receipt = await _db.Receipts
            .Include(r => r.Order).ThenInclude(o => o.Items).ThenInclude(i => i.MenuItem)
            .Include(r => r.Order).ThenInclude(o => o.Table)
            .FirstOrDefaultAsync(r => r.OrderId == orderId);

        return receipt != null ? BuildReceiptDto(receipt) : null;
    }

    private async Task<ReceiptDto> BuildReceiptDto(int orderId)
    {
        var receipt = await _db.Receipts
            .Include(r => r.Order).ThenInclude(o => o.Items).ThenInclude(i => i.MenuItem)
            .Include(r => r.Order).ThenInclude(o => o.Table)
            .FirstAsync(r => r.OrderId == orderId);

        return BuildReceiptDto(receipt);
    }

    private static ReceiptDto BuildReceiptDto(Receipt receipt)
    {
        var order = receipt.Order;
        return new ReceiptDto
        {
            Id = receipt.Id,
            ReceiptNumber = receipt.ReceiptNumber,
            OrderId = order.Id,
            TableNumber = order.Table.Number,
            TotalAmount = receipt.TotalAmount,
            PaidAmount = receipt.PaidAmount,
            TaxAmount = receipt.TaxAmount,
            TipAmount = receipt.TipAmount,
            PaymentMethods = receipt.PaymentMethods,
            GeneratedAt = receipt.GeneratedAt,
            Items = order.Items.Select(i => new ReceiptItemDto
            {
                Name = i.MenuItem.NameEn,
                NameKu = i.MenuItem.NameKu,
                Quantity = i.Quantity,
                Price = i.PriceAtOrder,
                Total = i.PriceAtOrder * i.Quantity,
            }).ToList(),
        };
    }
}
