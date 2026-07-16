using Microsoft.EntityFrameworkCore;
using RestaurantApp.Core.DTOs.Settings;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Exceptions;
using RestaurantApp.Core.Interfaces;
using RestaurantApp.Infrastructure.Data;

namespace RestaurantApp.Infrastructure.Services;

public class WallService : IWallService
{
    private readonly AppDbContext _db;

    public WallService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<WallDto>> GetByFloorAsync(int floor)
    {
        return await _db.Walls
            .Where(w => w.Floor == floor)
            .OrderBy(w => w.Id)
            .Select(w => new WallDto
            {
                Id = w.Id,
                Floor = w.Floor,
                StartX = w.StartX,
                StartY = w.StartY,
                EndX = w.EndX,
                EndY = w.EndY,
                ColorHex = w.ColorHex,
                Thickness = w.Thickness,
            })
            .ToListAsync();
    }

    public async Task<WallDto> CreateAsync(WallRequest request)
    {
        var wall = new Wall
        {
            Floor = request.Floor,
            StartX = request.StartX,
            StartY = request.StartY,
            EndX = request.EndX,
            EndY = request.EndY,
            ColorHex = request.ColorHex,
            Thickness = request.Thickness,
        };
        _db.Walls.Add(wall);
        await _db.SaveChangesAsync();

        return new WallDto
        {
            Id = wall.Id,
            Floor = wall.Floor,
            StartX = wall.StartX,
            StartY = wall.StartY,
            EndX = wall.EndX,
            EndY = wall.EndY,
            ColorHex = wall.ColorHex,
            Thickness = wall.Thickness,
        };
    }

    public async Task<WallDto> UpdateAsync(int id, WallRequest request)
    {
        var wall = await _db.Walls.FindAsync(id)
            ?? throw new NotFoundException($"Wall {id} not found");

        wall.Floor = request.Floor;
        wall.StartX = request.StartX;
        wall.StartY = request.StartY;
        wall.EndX = request.EndX;
        wall.EndY = request.EndY;
        wall.ColorHex = request.ColorHex;
        wall.Thickness = request.Thickness;
        wall.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return new WallDto
        {
            Id = wall.Id,
            Floor = wall.Floor,
            StartX = wall.StartX,
            StartY = wall.StartY,
            EndX = wall.EndX,
            EndY = wall.EndY,
            ColorHex = wall.ColorHex,
            Thickness = wall.Thickness,
        };
    }

    public async Task DeleteAsync(int id)
    {
        var wall = await _db.Walls.FindAsync(id)
            ?? throw new NotFoundException($"Wall {id} not found");
        _db.Walls.Remove(wall);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteBulkAsync(IEnumerable<int> ids)
    {
        var idsList = ids.ToList();
        var walls = await _db.Walls.Where(w => idsList.Contains(w.Id)).ToListAsync();
        _db.Walls.RemoveRange(walls);
        await _db.SaveChangesAsync();
    }
}
