using Microsoft.EntityFrameworkCore;
using AutoMapper;
using RestaurantApp.Core.DTOs.Common;
using RestaurantApp.Core.DTOs.Menu;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Exceptions;
using RestaurantApp.Core.Interfaces;
using RestaurantApp.Infrastructure.Data;

namespace RestaurantApp.Infrastructure.Services;

public class MenuService : IMenuService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public MenuService(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<IEnumerable<CategoryDto>> GetCategoriesAsync()
    {
        var categories = await _db.Categories.OrderBy(c => c.SortOrder).ThenBy(c => c.NameEn).ToListAsync();
        return _mapper.Map<IEnumerable<CategoryDto>>(categories);
    }

    public async Task<CategoryDto> CreateCategoryAsync(CategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.NameEn))
            throw new BadRequestException("Category English name is required");
        if (string.IsNullOrWhiteSpace(request.NameKu))
            throw new BadRequestException("Category Kurdish name is required");

        var existing = await _db.Categories.FirstOrDefaultAsync(c => c.NameEn == request.NameEn.Trim());
        if (existing != null)
            throw new ConflictException($"Category '{request.NameEn}' already exists");

        var maxSortOrder = await _db.Categories.MaxAsync(c => (int?)c.SortOrder) ?? -1;
        var category = new Category
        {
            NameEn = request.NameEn.Trim(),
            NameKu = request.NameKu.Trim(),
            SortOrder = maxSortOrder + 1
        };
        _db.Categories.Add(category);
        await _db.SaveChangesAsync();

        return _mapper.Map<CategoryDto>(category);
    }

    public async Task<CategoryDto> UpdateCategoryAsync(int id, CategoryRequest request)
    {
        var category = await _db.Categories.FindAsync(id)
            ?? throw new NotFoundException($"Category {id} not found");

        if (string.IsNullOrWhiteSpace(request.NameEn))
            throw new BadRequestException("Category English name is required");
        if (string.IsNullOrWhiteSpace(request.NameKu))
            throw new BadRequestException("Category Kurdish name is required");

        var existing = await _db.Categories.FirstOrDefaultAsync(c => c.NameEn == request.NameEn.Trim() && c.Id != id);
        if (existing != null)
            throw new ConflictException($"Category '{request.NameEn}' already exists");

        category.NameEn = request.NameEn.Trim();
        category.NameKu = request.NameKu.Trim();
        await _db.SaveChangesAsync();

        return _mapper.Map<CategoryDto>(category);
    }

    public async Task DeleteCategoryAsync(int id)
    {
        var category = await _db.Categories.FindAsync(id)
            ?? throw new NotFoundException($"Category {id} not found");

        var hasItems = await _db.MenuItems.AnyAsync(m => m.CategoryId == id);
        if (hasItems)
            throw new ConflictException("Cannot delete category with existing menu items");

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();
    }

    public async Task<PaginatedResponse<MenuItemDto>> GetMenuItemsAsync(int? categoryId = null, bool? available = null, int page = 1, int pageSize = 20)
    {
        var query = _db.MenuItems
            .Include(m => m.Category)
            .AsQueryable();

        if (categoryId.HasValue)
            query = query.Where(m => m.CategoryId == categoryId.Value);
        if (available.HasValue)
            query = query.Where(m => m.Available == available.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(m => m.SortOrder).ThenBy(m => m.NameEn)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PaginatedResponse<MenuItemDto>
        {
            Items = _mapper.Map<IEnumerable<MenuItemDto>>(items),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<MenuItemDto> GetMenuItemByIdAsync(int id)
    {
        var item = await _db.MenuItems
            .Include(m => m.Category)
            .FirstOrDefaultAsync(m => m.Id == id)
            ?? throw new NotFoundException($"MenuItem {id} not found");

        return _mapper.Map<MenuItemDto>(item);
    }

    public async Task<MenuItemDto> CreateMenuItemAsync(MenuItemRequest request)
    {
        var category = await _db.Categories
            .FirstOrDefaultAsync(c => c.Id == request.CategoryId)
            ?? throw new NotFoundException($"Category {request.CategoryId} not found");

        var maxSortOrder = await _db.MenuItems
            .Where(m => m.CategoryId == request.CategoryId)
            .MaxAsync(m => (int?)m.SortOrder) ?? -1;

        var item = new MenuItem
        {
            CategoryId = request.CategoryId,
            NameEn = request.NameEn.Trim(),
            NameKu = request.NameKu.Trim(),
            Price = request.Price,
            DescriptionEn = request.DescriptionEn,
            DescriptionKu = request.DescriptionKu,
            Available = request.Available,
            ImageUrl = request.ImageUrl,
            SortOrder = maxSortOrder + 1
        };

        _db.MenuItems.Add(item);
        await _db.SaveChangesAsync();

        // Reload with category for AutoMapper mapping
        var loaded = await _db.MenuItems
            .Include(m => m.Category)
            .FirstOrDefaultAsync(m => m.Id == item.Id)
            ?? throw new NotFoundException($"MenuItem {item.Id} not found");

        return _mapper.Map<MenuItemDto>(loaded);
    }

    public async Task<MenuItemDto> UpdateMenuItemAsync(int id, MenuItemRequest request)
    {
        var item = await _db.MenuItems.Include(m => m.Category).FirstOrDefaultAsync(m => m.Id == id)
            ?? throw new NotFoundException($"MenuItem {id} not found");

        item.CategoryId = request.CategoryId;
        item.NameEn = request.NameEn.Trim();
        item.NameKu = request.NameKu.Trim();
        item.Price = request.Price;
        item.DescriptionEn = request.DescriptionEn;
        item.DescriptionKu = request.DescriptionKu;
        item.Available = request.Available;
        item.ImageUrl = request.ImageUrl;

        await _db.SaveChangesAsync();

        return _mapper.Map<MenuItemDto>(item);
    }

    public async Task DeleteMenuItemAsync(int id)
    {
        var item = await _db.MenuItems.FindAsync(id)
            ?? throw new NotFoundException($"MenuItem {id} not found");

        // Check if item is referenced by existing orders
        var hasOrderItems = await _db.OrderItems.AnyAsync(oi => oi.MenuItemId == id);
        if (hasOrderItems)
            throw new ConflictException("Cannot delete menu item that is part of existing orders");

        _db.MenuItems.Remove(item);
        await _db.SaveChangesAsync();
    }

    public async Task ReorderCategoriesAsync(List<ReorderItemRequest> items)
    {
        var ids = items.Select(i => i.Id).ToHashSet();
        var categories = await _db.Categories.Where(c => ids.Contains(c.Id)).ToListAsync();

        foreach (var cat in categories)
        {
            var reorderItem = items.First(i => i.Id == cat.Id);
            cat.SortOrder = reorderItem.SortOrder;
        }

        await _db.SaveChangesAsync();
    }

    public async Task ReorderMenuItemsAsync(List<ReorderItemRequest> items)
    {
        var ids = items.Select(i => i.Id).ToHashSet();
        var menuItems = await _db.MenuItems.Where(m => ids.Contains(m.Id)).ToListAsync();

        foreach (var item in menuItems)
        {
            var reorderItem = items.First(i => i.Id == item.Id);
            item.SortOrder = reorderItem.SortOrder;
        }

        await _db.SaveChangesAsync();
    }
}
