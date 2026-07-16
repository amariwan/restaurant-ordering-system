using Microsoft.EntityFrameworkCore;
using AutoMapper;
using RestaurantApp.Core.DTOs.Tables;
using RestaurantApp.Core.Exceptions;
using RestaurantApp.Core.Interfaces;
using RestaurantApp.Core.Enums;
using RestaurantApp.Infrastructure.Data;

namespace RestaurantApp.Infrastructure.Services;

public class TableService : ITableService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public TableService(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<IEnumerable<TableDto>> GetAllAsync(int? floor = null)
    {
        var query = _db.Tables.OrderBy(t => t.Number).AsQueryable();
        if (floor.HasValue) query = query.Where(t => t.Floor == floor.Value);
        var tables = await query.ToListAsync();
        return _mapper.Map<IEnumerable<TableDto>>(tables);
    }


    public async Task<TableDto> CreateAsync(TableRequest request)
    {
        if (await _db.Tables.AnyAsync(t => t.Number == request.Number))
            throw new ConflictException($"Table number {request.Number} already exists");

        var shape = ParseShape(request.Shape);
        var width = request.Width ?? (shape == TableShape.Circle || shape == TableShape.Square ? 72 : 80);
        var height = request.Height ?? (shape == TableShape.Circle || shape == TableShape.Square ? 72 : 56);

        var table = new Core.Entities.Table
        {
            Number = request.Number,
            Capacity = request.Capacity,
            PosX = request.PosX,
            PosY = request.PosY,
            Area = request.Area,
            ImageUrl = request.ImageUrl,
            Status = request.Status,
            Shape = shape,
            Width = width,
            Height = height,
            Rotation = request.Rotation ?? 0,
            ColorHex = request.ColorHex,
            Description = request.Description,
            Type = ParseType(request.Type),
            IsActive = request.IsActive ?? true,
            Floor = request.Floor ?? 1,
        };

        _db.Tables.Add(table);
        await _db.SaveChangesAsync();

        return _mapper.Map<TableDto>(table);
    }

    public async Task<TableDto> UpdateAsync(int id, TableRequest request)
    {
        var table = await _db.Tables.FindAsync(id)
            ?? throw new NotFoundException($"Table {id} not found");

        if (await _db.Tables.AnyAsync(t => t.Number == request.Number && t.Id != id))
            throw new ConflictException($"Table number {request.Number} already exists");

        table.Number = request.Number;
        table.Capacity = request.Capacity;
        table.PosX = request.PosX;
        table.PosY = request.PosY;
        table.Area = request.Area;
        table.ImageUrl = request.ImageUrl;
        table.Status = request.Status;

        if (request.Shape != null) table.Shape = ParseShape(request.Shape);
        if (request.Width.HasValue) table.Width = request.Width.Value;
        if (request.Height.HasValue) table.Height = request.Height.Value;
        if (request.Rotation.HasValue) table.Rotation = request.Rotation.Value;
        if (request.ColorHex != null) table.ColorHex = request.ColorHex;
        if (request.Description != null) table.Description = request.Description;
        if (request.Type != null) table.Type = ParseType(request.Type);
        if (request.IsActive.HasValue) table.IsActive = request.IsActive.Value;
        if (request.Floor.HasValue) table.Floor = request.Floor.Value;

        table.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return _mapper.Map<TableDto>(table);
    }

    public async Task DeleteAsync(int id)
    {
        var table = await _db.Tables.FindAsync(id)
            ?? throw new NotFoundException($"Table {id} not found");

        if (table.Status == TableStatus.Occupied)
            throw new ConflictException("Cannot delete an occupied table");

        _db.Tables.Remove(table);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteBulkAsync(IEnumerable<int> ids)
    {
        var idsList = ids.ToList();
        var tables = await _db.Tables.Where(t => idsList.Contains(t.Id)).ToListAsync();
        var occupied = tables.FirstOrDefault(t => t.Status == TableStatus.Occupied);
        if (occupied != null)
            throw new ConflictException($"Cannot delete occupied table {occupied.Number}");
        _db.Tables.RemoveRange(tables);
        await _db.SaveChangesAsync();
    }

    public async Task<IEnumerable<TableDto>> UpdateBulkAsync(IEnumerable<int> ids, TableRequest request)
    {
        var idsList = ids.ToList();
        var tables = await _db.Tables.Where(t => idsList.Contains(t.Id)).ToListAsync();
        foreach (var table in tables)
        {
            table.Capacity = request.Capacity;
            table.Area = request.Area;
            table.Status = request.Status;
            if (request.Shape != null) table.Shape = ParseShape(request.Shape);
            if (request.Width.HasValue) table.Width = request.Width.Value;
            if (request.Height.HasValue) table.Height = request.Height.Value;
            if (request.Rotation.HasValue) table.Rotation = request.Rotation.Value;
            if (request.ColorHex != null) table.ColorHex = request.ColorHex;
            if (request.Type != null) table.Type = ParseType(request.Type);
            if (request.Floor.HasValue) table.Floor = request.Floor.Value;
            table.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
        return _mapper.Map<IEnumerable<TableDto>>(tables);
    }

    public async Task<IEnumerable<TableDto>> MoveBulkAsync(IEnumerable<(int id, double posX, double posY)> positions)
    {
        var posList = positions.ToList();
        var ids = posList.Select(p => p.id).ToList();
        var tables = await _db.Tables.Where(t => ids.Contains(t.Id)).ToListAsync();
        foreach (var (id, posX, posY) in posList)
        {
            var table = tables.FirstOrDefault(t => t.Id == id);
            if (table == null) continue;
            table.PosX = posX;
            table.PosY = posY;
            table.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
        return _mapper.Map<IEnumerable<TableDto>>(tables);
    }

    private static TableShape ParseShape(string? shape)
    {
        if (string.IsNullOrWhiteSpace(shape)) return TableShape.Circle;
        return Enum.TryParse<TableShape>(shape, true, out var parsed) ? parsed : TableShape.Circle;
    }

    private static TableType ParseType(string? type)
    {
        if (string.IsNullOrWhiteSpace(type)) return TableType.Regular;
        return Enum.TryParse<TableType>(type, true, out var parsed) ? parsed : TableType.Regular;
    }
}
