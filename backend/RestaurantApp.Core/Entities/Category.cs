using RestaurantApp.Core.Common;

namespace RestaurantApp.Core.Entities;

public class Category : BaseEntity, IAuditableEntity
{
    public string NameEn { get; set; } = string.Empty;
    public string NameKu { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<MenuItem> MenuItems { get; set; } = [];
}
