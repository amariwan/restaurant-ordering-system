using System.Linq.Expressions;
using RestaurantApp.Core.Exceptions;

namespace Microsoft.EntityFrameworkCore;

public static class DbContextExtensions
{
    /// <summary>
    /// Finds an entity by primary key or throws NotFoundException.
    /// </summary>
    public static async Task<TEntity> FindOrFailAsync<TEntity>(
        this DbSet<TEntity> dbSet,
        params object[] keyValues)
        where TEntity : class
    {
        var entity = await dbSet.FindAsync(keyValues);
        return entity ?? throw new NotFoundException($"{typeof(TEntity).Name} not found for keys [{string.Join(", ", keyValues)}]");
    }

    /// <summary>
    /// Finds the first matching entity by predicate or throws NotFoundException.
    /// </summary>
    public static async Task<TEntity> FirstOrFailAsync<TEntity>(
        this DbSet<TEntity> dbSet,
        Expression<Func<TEntity, bool>> predicate)
        where TEntity : class
    {
        var entity = await dbSet.FirstOrDefaultAsync(predicate);
        return entity ?? throw new NotFoundException($"{typeof(TEntity).Name} not found");
    }

    /// <summary>
    /// Removes a single item and returns true if it existed.
    /// </summary>
    public static bool TryRemove<TEntity>(this DbSet<TEntity> dbSet, TEntity entity)
        where TEntity : class
    {
        if (dbSet.Local.Any(e => object.ReferenceEquals(e, entity)))
            dbSet.Local.Remove(entity);
        dbSet.Remove(entity);
        return true;
    }
}
