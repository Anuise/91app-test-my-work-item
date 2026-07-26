using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using _91app_backend.Contracts;
using _91app_backend.Models;
using _91app_backend.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace _91app_backend.Services;

public sealed class AuthService(
    IUserRepository userRepository,
    IPasswordHasher<User> passwordHasher,
    IOptions<JwtOptions> jwtOptions) : IAuthService
{
    public async Task<LoginResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        var user = await userRepository.FindByUsernameAsync(request.Username.Trim(), cancellationToken);
        if (user is null)
        {
            return null;
        }

        var verification = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.ClientHash);
        if (verification == PasswordVerificationResult.Failed)
        {
            return null;
        }

        var options = jwtOptions.Value;
        var issuedAt = DateTime.UtcNow;
        var expiresAt = issuedAt.AddHours(options.ExpiryHours);
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim("name", user.Name),
            new Claim("role", user.Role)
        };
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.Key)),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            options.Issuer,
            options.Audience,
            claims,
            issuedAt,
            expiresAt,
            credentials);

        return new LoginResponse(
            new JwtSecurityTokenHandler().WriteToken(token),
            expiresAt,
            new AuthenticatedUser(user.Id, user.Name, user.Role));
    }
}
