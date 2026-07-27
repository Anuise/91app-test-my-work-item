using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using _91app_backend.Data;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Xunit;

namespace _91app_backend.Tests;

public sealed class AuthApiTests : IClassFixture<AuthApiFactory>
{
    private const string UserClientHash = "e73b3e692eacfa6219213cac29e48e053064d9ee138ee1d4a28b2a935e289d3a";
    private readonly HttpClient _client;

    public AuthApiTests(AuthApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Valid_credentials_return_24_hour_jwt_with_identity_claims()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            username = "user",
            clientHash = UserClientHash
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("success").GetBoolean().Should().BeTrue();
        var data = body.GetProperty("data");
        var token = new JwtSecurityTokenHandler().ReadJwtToken(data.GetProperty("accessToken").GetString());
        token.Claims.Should().ContainSingle(claim => claim.Type == "sub");
        token.Claims.Should().ContainSingle(claim => claim.Type == "name" && claim.Value == "User");
        token.Claims.Should().ContainSingle(claim => claim.Type == "role" && claim.Value == "User");
        (token.ValidTo - token.ValidFrom).Should().BeCloseTo(TimeSpan.FromHours(24), TimeSpan.FromMinutes(1));
    }

    [Fact]
    public async Task Second_seed_user_can_login_for_status_isolation_smoke_test()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            username = "user2",
            clientHash = UserClientHash
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("data").GetProperty("user").GetProperty("name").GetString().Should().Be("User 2");
        body.GetProperty("data").GetProperty("user").GetProperty("role").GetString().Should().Be("User");
    }

    [Fact]
    public async Task Invalid_credentials_return_consistent_error_envelope_with_trace_id()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            username = "user",
            clientHash = new string('0', 64)
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("success").GetBoolean().Should().BeFalse();
        body.GetProperty("data").ValueKind.Should().Be(JsonValueKind.Null);
        body.GetProperty("message").GetString().Should().Be("帳號或密碼錯誤");
        body.GetProperty("errors").GetArrayLength().Should().BeGreaterThan(0);
        body.GetProperty("traceId").GetString().Should().NotBeNullOrWhiteSpace();
        response.Headers.GetValues("X-Trace-ID").Single().Should().Be(body.GetProperty("traceId").GetString());
    }

    [Fact]
    public async Task Malformed_login_json_returns_the_same_error_contract()
    {
        using var content = new StringContent("{ invalid", System.Text.Encoding.UTF8, "application/json");

        var response = await _client.PostAsync("/api/v1/auth/login", content);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("success").GetBoolean().Should().BeFalse();
        body.GetProperty("data").ValueKind.Should().Be(JsonValueKind.Null);
        body.GetProperty("message").GetString().Should().Be("請求資料格式不正確");
        body.GetProperty("traceId").GetString().Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Protected_request_without_token_returns_same_error_contract()
    {
        var response = await _client.GetAsync("/api/v1/auth/session");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("success").GetBoolean().Should().BeFalse();
        body.GetProperty("message").GetString().Should().Be("需要登入才能存取此資源");
        body.GetProperty("traceId").GetString().Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Valid_token_can_restore_the_authenticated_session()
    {
        var loginResponse = await _client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            username = "user",
            clientHash = UserClientHash
        });
        var loginBody = await loginResponse.Content.ReadFromJsonAsync<JsonElement>();
        var accessToken = loginBody.GetProperty("data").GetProperty("accessToken").GetString();
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/auth/session");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("data").GetProperty("name").GetString().Should().Be("User");
        body.GetProperty("data").GetProperty("role").GetString().Should().Be("User");
    }

    [Fact]
    public void Migration_creates_users_schema_and_seed_accounts()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=migration-test;Username=test;Password=test")
            .Options;
        using var context = new AppDbContext(options);

        var script = context.Database.GetService<IMigrator>().GenerateScript();

        script.Should().Contain("CREATE TABLE \"Users\"");
        script.Should().Contain("CREATE UNIQUE INDEX \"IX_Users_Username\"");
        script.Should().Contain("'user'");
        script.Should().Contain("'user2'");
        script.Should().Contain("'admin'");
        script.Should().Contain("ALTER TABLE \"WorkItems\" ADD \"IsDeleted\"");
    }
}

public sealed class AuthApiFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"auth-tests-{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:DefaultConnection", "Host=localhost;Database=test;Username=test;Password=test");
        builder.UseSetting("Jwt:Issuer", "MyWorkItem.Api");
        builder.UseSetting("Jwt:Audience", "MyWorkItem.Web");
        builder.UseSetting("Jwt:Key", "test-only-jwt-signing-key-with-at-least-32-characters");
        builder.UseSetting("Jwt:ExpiryHours", "24");
        builder.UseSetting("Cors:AllowedOrigins:0", "http://localhost:3000");
        builder.ConfigureLogging(logging => logging.ClearProviders());
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(_databaseName));
        });
    }
}
