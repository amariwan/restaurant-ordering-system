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

    public async Task<IEnumerable<TableDto>> GetAllAsync()
    {
        var tables = await _db.Tables.OrderBy(t => t.Number).ToListAsync();
        return _mapper.Map<IEnumerable<TableDto>>(tables);
    }


    public async Task<TableDto> CreateAsync(TableRequest request)
    {
        if (await _db.Tables.AnyAsync(t => t.Number == request.Number))
            throw new ConflictException($"Table number {request.Number} already exists");

        var table = new Core.Entities.Table
        {
            Number = request.Number,
            Status = request.Status
        };

        _db.Tables.Add(table);
        await _db.SaveChangesAsync();

        return _mapper.Map<TableDto>(table);
    }

    public async Task<TableDto> UpdateAsync(int id, TableRequest request)
    {
        var table = await _db.Tables.FindAsync(id)
            ?? throw new NotFoundException($"Table {id} not found");

        // Check for duplicate number (excluding current table)
        if (await _db.Tables.AnyAsync(t => t.Number == request.Number && t.Id != id))
            throw new ConflictException($"Table number {request.Number} already exists");

        table.Number = request.Number;
        table.Status = request.Status;
        await _db.SaveChangesAsync();

        return _mapper.Map<TableDto>(table);
    }

    public async Task DeleteAsync(int id)
    {
        var table = await _db.Tables.FindAsync(id)
            ?? throw new NotFoundException($"Table {id} not found");

        // Prevent deletion of occupied tables
        if (table.Status == TableStatus.Occupied)
            throw new ConflictException("Cannot delete an occupied table");

        _db.Tables.Remove(table);
        await _db.SaveChangesAsync();
    }
}
