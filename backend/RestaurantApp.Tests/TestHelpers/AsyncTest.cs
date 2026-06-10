namespace RestaurantApp.Tests;

internal static class AsyncTest
{
    public static Func<Task> Act(Func<Task> action) => action;
}
