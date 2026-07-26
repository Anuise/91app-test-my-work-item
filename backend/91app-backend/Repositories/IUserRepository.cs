using _91app_backend.Models;

namespace _91app_backend.Repositories;

public interface IUserRepository
{
    Task<User?> FindByUsernameAsync(string username, CancellationToken cancellationToken);
}
