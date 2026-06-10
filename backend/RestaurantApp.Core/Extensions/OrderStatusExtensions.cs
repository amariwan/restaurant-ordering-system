using RestaurantApp.Core.Enums;
using RestaurantApp.Core.Exceptions;

namespace RestaurantApp.Core.Extensions;

public static class OrderStatusExtensions
{
    private static readonly Dictionary<OrderStatus, List<OrderStatus>> AllowedTransitions = new()
    {
        [OrderStatus.Pending]   = [OrderStatus.Preparing, OrderStatus.Cancelled],
        [OrderStatus.Preparing] = [OrderStatus.Ready, OrderStatus.Cancelled],
        [OrderStatus.Ready]     = [OrderStatus.Served, OrderStatus.Cancelled],
        [OrderStatus.Served]    = [],
        [OrderStatus.Cancelled] = [],
    };

    public static bool CanTransitionTo(this OrderStatus current, OrderStatus next)
    {
        return AllowedTransitions.TryGetValue(current, out var allowed) && allowed.Contains(next);
    }

    public static void EnsureTransitionAllowed(this OrderStatus current, OrderStatus next)
    {
        if (!current.CanTransitionTo(next))
            throw new ForbiddenException($"Cannot transition from {current} to {next}");
    }

    public static bool IsModifiable(this OrderStatus status)
    {
        return status is OrderStatus.Pending or OrderStatus.Preparing;
    }
}
