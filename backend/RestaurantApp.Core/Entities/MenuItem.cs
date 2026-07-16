using RestaurantApp.Core.Common;

namespace RestaurantApp.Core.Entities;

public class MenuItem : BaseEntity, IAuditableEntity
{
    public int CategoryId { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameKu { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool Available { get; set; } = true;
    public string? DescriptionEn { get; set; }
    public string? DescriptionKu { get; set; }
    public string? ImageUrl { get; set; }
    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Category Category { get; set; } = null!;
    public ICollection<OrderItem> OrderItems { get; set; } = [];
}
