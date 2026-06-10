using System;
using System.Collections.Generic;

namespace RestaurantApp.Core.DTOs.Common;

public class PaginatedResponse<T>
{
    public required IEnumerable<T> Items { get; set; }
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)Math.Max(1, PageSize));
}
