using Microsoft.EntityFrameworkCore;
using AutoMapper;
using RestaurantApp.Core.DTOs.Common;
using RestaurantApp.Core.DTOs.Reservations;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;
using RestaurantApp.Core.Exceptions;
using RestaurantApp.Core.Interfaces;
using RestaurantApp.Infrastructure.Data;

namespace RestaurantApp.Infrastructure.Services;

public class ReservationService : IReservationService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public ReservationService(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<PaginatedResponse<ReservationDto>> GetAllAsync(ReservationStatus? status = null, DateTime? date = null, int page = 1, int pageSize = 20)
    {
        var query = _db.Reservations
            .Include(r => r.Table)
            .Include(r => r.User)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(r => r.Status == status.Value);

        if (date.HasValue)
        {
            var start = date.Value.Date;
            var end = start.AddDays(1);
            query = query.Where(r => r.ReservationTime >= start && r.ReservationTime < end);
        }

        query = query.OrderByDescending(r => r.ReservationTime);

        var totalCount = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PaginatedResponse<ReservationDto>
        {
            Items = _mapper.Map<IEnumerable<ReservationDto>>(items),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ReservationDto> GetByIdAsync(int id)
    {
        var reservation = await _db.Reservations
            .Include(r => r.Table)
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == id)
            ?? throw new NotFoundException($"Reservation {id} not found");

        return _mapper.Map<ReservationDto>(reservation);
    }

    public async Task<ReservationDto> CreateAsync(CreateReservationRequest request, int? userId = null)
    {
        var reservation = new Reservation
        {
            CustomerName = request.CustomerName,
            CustomerEmail = request.CustomerEmail,
            CustomerPhone = request.CustomerPhone,
            GuestCount = request.GuestCount,
            ReservationTime = request.ReservationTime,
            Note = request.Note,
            UserId = userId
        };

        _db.Reservations.Add(reservation);
        await _db.SaveChangesAsync();

        return _mapper.Map<ReservationDto>(reservation);
    }

    public async Task<ReservationDto> UpdateAsync(int id, UpdateReservationRequest request)
    {
        var reservation = await _db.Reservations
            .Include(r => r.Table)
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == id)
            ?? throw new NotFoundException($"Reservation {id} not found");

        if (request.TableId.HasValue && request.TableId.Value != reservation.TableId)
        {
            var table = await _db.Tables.FindAsync(request.TableId.Value)
                ?? throw new NotFoundException($"Table {request.TableId.Value} not found");

            var conflict = await _db.Reservations.AnyAsync(r =>
                r.Id != id &&
                r.TableId == request.TableId.Value &&
                r.Status == ReservationStatus.Confirmed &&
                r.ReservationTime.Date == reservation.ReservationTime.Date);

            if (conflict)
                throw new ConflictException($"Table {request.TableId.Value} already has a confirmed reservation on this date");

            reservation.TableId = request.TableId.Value;
        }

        if (request.CustomerName != null) reservation.CustomerName = request.CustomerName;
        if (request.CustomerEmail != null) reservation.CustomerEmail = request.CustomerEmail;
        if (request.CustomerPhone != null) reservation.CustomerPhone = request.CustomerPhone;
        if (request.GuestCount.HasValue) reservation.GuestCount = request.GuestCount.Value;
        if (request.ReservationTime.HasValue) reservation.ReservationTime = request.ReservationTime.Value;
        if (request.Note != null) reservation.Note = request.Note;

        await _db.SaveChangesAsync();

        return _mapper.Map<ReservationDto>(reservation);
    }

    public async Task<ReservationDto> UpdateStatusAsync(int id, ReservationStatus status)
    {
        var reservation = await _db.Reservations
            .Include(r => r.Table)
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == id)
            ?? throw new NotFoundException($"Reservation {id} not found");

        if (reservation.Status == status)
            return _mapper.Map<ReservationDto>(reservation);

        if (status == ReservationStatus.Confirmed)
        {
            if (!reservation.TableId.HasValue)
                throw new BadRequestException("Cannot confirm a reservation without an assigned table");

            var table = await _db.Tables.FindAsync(reservation.TableId.Value);
            if (table != null)
            {
                table.Status = TableStatus.Reserved;
            }
        }

        if (status == ReservationStatus.Completed || status == ReservationStatus.Cancelled)
        {
            if (reservation.TableId.HasValue)
            {
                var table = await _db.Tables.FindAsync(reservation.TableId.Value);
                if (table != null && table.Status == TableStatus.Reserved)
                {
                    table.Status = TableStatus.Free;
                }
            }
        }

        reservation.Status = status;
        await _db.SaveChangesAsync();

        return _mapper.Map<ReservationDto>(reservation);
    }

    public async Task DeleteAsync(int id)
    {
        var reservation = await _db.Reservations.FindAsync(id)
            ?? throw new NotFoundException($"Reservation {id} not found");

        _db.Reservations.Remove(reservation);
        await _db.SaveChangesAsync();
    }
}
