using _91app_backend.Data;
using _91app_backend.Models;
using Microsoft.EntityFrameworkCore;

namespace _91app_backend.Repositories;

public sealed class UserRepository(AppDbContext context) : IUserRepository
{
    public Task<User?> FindByUsernameAsync(string username, CancellationToken cancellationToken)
    {
        return context.Users.SingleOrDefaultAsync(
            user => user.Username == username,
            cancellationToken);
    }
}
