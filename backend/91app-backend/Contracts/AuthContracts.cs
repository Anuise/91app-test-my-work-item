namespace _91app_backend.Contracts;

public sealed record LoginRequest(string Username, string ClientHash);

public sealed record AuthenticatedUser(Guid Id, string Name, string Role);

public sealed record LoginResponse(
    string AccessToken,
    DateTime ExpiresAt,
    AuthenticatedUser User);
