using System;
using System.Collections.Generic;

namespace RestaurantApp.Core.DTOs.Receipts;

public class ReceiptDto
{
    public int Id { get; set; }
    public required string ReceiptNumber { get; set; }
    public int OrderId { get; set; }
    public int TableNumber { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TipAmount { get; set; }
    public required string PaymentMethods { get; set; }
    public DateTime GeneratedAt { get; set; }
    public required List<ReceiptItemDto> Items { get; set; }
}

public class ReceiptItemDto
{
    public required string Name { get; set; }
    public required string NameKu { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public decimal Total { get; set; }
}
