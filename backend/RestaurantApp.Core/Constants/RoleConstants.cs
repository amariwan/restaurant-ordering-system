namespace RestaurantApp.Core.Constants;

public static class RoleConstants
{
    public const string Admin = "Admin";
    public const string Waiter = "Waiter";
    public const string Kitchen = "Kitchen";

    public const string AdminWaiter = "Admin,Waiter";
    public const string AdminWaiterKitchen = "Admin,Waiter,Kitchen";

    public const string KitchenGroup = "kitchen";
    public const string WaiterGroup = "waiter";
}
