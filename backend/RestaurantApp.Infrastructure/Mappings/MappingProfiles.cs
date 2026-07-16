using AutoMapper;
using RestaurantApp.Core.DTOs.Auth;
using RestaurantApp.Core.DTOs.Menu;
using RestaurantApp.Core.DTOs.Orders;
using RestaurantApp.Core.DTOs.Payments;
using RestaurantApp.Core.DTOs.Reservations;
using RestaurantApp.Core.DTOs.Settings;
using RestaurantApp.Core.DTOs.Tables;
using RestaurantApp.Core.DTOs.Users;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;

namespace RestaurantApp.Infrastructure.Mappings;

public class MappingProfiles : Profile
{
    public MappingProfiles()
    {
        CreateMap<User, UserDto>();

        CreateMap<Category, CategoryDto>().ReverseMap();

        CreateMap<MenuItem, MenuItemDto>()
            .ForMember(d => d.CategoryNameEn, opt => opt.MapFrom(s => s.Category != null ? s.Category.NameEn : string.Empty))
            .ForMember(d => d.CategoryNameKu, opt => opt.MapFrom(s => s.Category != null ? s.Category.NameKu : string.Empty));

        CreateMap<Order, OrderDto>()
            .ForMember(d => d.TableNumber, opt => opt.MapFrom(s => s.Table.Number));

        CreateMap<OrderItem, OrderItemDto>()
            .ForMember(d => d.MenuItemName, opt => opt.MapFrom(s => s.MenuItem != null ? s.MenuItem.NameEn : string.Empty))
            .ForMember(d => d.MenuItemNameKu, opt => opt.MapFrom(s => s.MenuItem != null ? s.MenuItem.NameKu : string.Empty))
            .ForMember(d => d.Price, opt => opt.MapFrom(s => s.PriceAtOrder));

        CreateMap<Payment, PaymentDto>().ReverseMap();

        CreateMap<Table, TableDto>()
            .ForMember(d => d.Shape, opt => opt.MapFrom(s => s.Shape.ToString()))
            .ForMember(d => d.Type, opt => opt.MapFrom(s => s.Type.ToString()));
        CreateMap<TableDto, Table>()
            .ForMember(d => d.Shape, opt => opt.MapFrom(s => Enum.Parse<TableShape>(s.Shape)))
            .ForMember(d => d.Type, opt => opt.MapFrom(s => Enum.Parse<TableType>(s.Type)));

        CreateMap<Reservation, ReservationDto>()
            .ForMember(d => d.TableNumber, opt => opt.MapFrom(s => s.Table != null ? s.Table.Number : 0))
            .ForMember(d => d.StaffName, opt => opt.MapFrom(s => s.User != null ? s.User.Name : null));

    }
}
