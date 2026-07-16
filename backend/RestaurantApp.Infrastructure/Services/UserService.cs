using Microsoft.EntityFrameworkCore;
using AutoMapper;
using RestaurantApp.Core.DTOs.Common;
using RestaurantApp.Core.DTOs.Users;
using RestaurantApp.Core.Enums;
using RestaurantApp.Core.Exceptions;
using RestaurantApp.Core.Interfaces;
using RestaurantApp.Infrastructure.Data;

namespace RestaurantApp.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public UserService(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<PaginatedResponse<UserDto>> GetAllAsync(string? search = null, int page = 1, int pageSize = 20)
    {
        var query = _db.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(u => u.Name.Contains(search) || u.Email.Contains(search));

        var totalCount = await query.CountAsync();

        var users = await query
            .OrderBy(u => u.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PaginatedResponse<UserDto>
        {
            Items = _mapper.Map<IEnumerable<UserDto>>(users),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<UserDto> UpdateAsync(int id, string name, string email, string role)
    {
        var user = await _db.Users.FindAsync(id)
            ?? throw new NotFoundException($"User {id} not found");

        var emailExists = await _db.Users.AnyAsync(u => u.Id != id && u.Email == email);

        if (emailExists)
            throw new ConflictException($"Email {email} is already in use");

        user.Name = name;
        user.Email = email;

        if (!Enum.TryParse<UserRole>(role, true, out var userRole))
            throw new BadRequestException($"Invalid role: {role}");

        user.Role = userRole;
        await _db.SaveChangesAsync();

        return _mapper.Map<UserDto>(user);
    }

    public async Task DeleteAsync(int id)
    {
        var user = await _db.Users.FindAsync(id)
            ?? throw new NotFoundException($"User {id} not found");

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
    }
}
