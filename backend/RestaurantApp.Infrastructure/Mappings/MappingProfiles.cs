using AutoMapper;
using RestaurantApp.Core.DTOs.Auth;
using RestaurantApp.Core.DTOs.Menu;
using RestaurantApp.Core.DTOs.Orders;
using RestaurantApp.Core.DTOs.Payments;
using RestaurantApp.Core.DTOs.Reservations;
using RestaurantApp.Core.DTOs.Tables;
using RestaurantApp.Core.DTOs.Users;
using RestaurantApp.Core.Entities;

namespace RestaurantApp.Infrastructure.Mappings;

public class MappingProfiles : Profile
{
    public MappingProfiles()
    {
        CreateMap<User, UserDto>();

        CreateMap<Category, CategoryDto>();

        CreateMap<MenuItem, MenuItemDto>()
            .ForMember(d => d.CategoryNameEn, opt => opt.MapFrom(s => s.Category.NameEn))
            .ForMember(d => d.CategoryNameKu, opt => opt.MapFrom(s => s.Category.NameKu));

        CreateMap<Order, OrderDto>()
            .ForMember(d => d.TableNumber, opt => opt.MapFrom(s => s.Table.Number));

        CreateMap<OrderItem, OrderItemDto>()
            .ForMember(d => d.MenuItemName, opt => opt.MapFrom(s => s.MenuItem.NameEn))
            .ForMember(d => d.MenuItemNameKu, opt => opt.MapFrom(s => s.MenuItem.NameKu))
            .ForMember(d => d.Price, opt => opt.MapFrom(s => s.PriceAtOrder));

        CreateMap<Payment, PaymentDto>();

        CreateMap<Table, TableDto>();

        CreateMap<Reservation, ReservationDto>()
            .ForMember(d => d.TableNumber, opt => opt.MapFrom(s => s.Table != null ? s.Table.Number : 0))
            .ForMember(d => d.StaffName, opt => opt.MapFrom(s => s.User != null ? s.User.Name : null));
    }
}
