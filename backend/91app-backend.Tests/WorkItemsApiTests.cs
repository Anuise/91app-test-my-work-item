using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using _91app_backend.Data;
using _91app_backend.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Xunit;

namespace _91app_backend.Tests;

public sealed class WorkItemsApiTests : IClassFixture<WorkItemsApiFactory>
{
    private const string UserClientHash = "e73b3e692eacfa6219213cac29e48e053064d9ee138ee1d4a28b2a935e289d3a";
    private const string AdminClientHash = "a23ce44b64127048f83e191a44bc83079eb1c5d1e9eae2c779b90066f96f7fdb";
    private static readonly Guid UserId = Guid.Parse("8d89c4b0-490b-4f58-a9ba-494bfbd5556f");

    private readonly WorkItemsApiFactory _factory;
    private readonly HttpClient _client;

    public WorkItemsApiTests(WorkItemsApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Request_without_token_returns_401_envelope()
    {
        var response = await _client.GetAsync("/api/v1/work-items");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("success").GetBoolean().Should().BeFalse();
        body.GetProperty("traceId").GetString().Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Unsupported_sortBy_value_returns_400_envelope()
    {
        var token = await LoginAsync("user", UserClientHash);

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/work-items?sortBy=title");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("success").GetBoolean().Should().BeFalse();
        body.GetProperty("traceId").GetString().Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Unsupported_sortOrder_value_returns_400_envelope()
    {
        var token = await LoginAsync("user", UserClientHash);

        var response = await GetWorkItemsAsync(token, "sideways");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("success").GetBoolean().Should().BeFalse();
        body.GetProperty("traceId").GetString().Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Returns_explicit_empty_list_when_no_work_items_exist()
    {
        await ReplaceWorkItemsAsync();
        var token = await LoginAsync("user", UserClientHash);

        var response = await GetWorkItemsAsync(token);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("success").GetBoolean().Should().BeTrue();
        body.GetProperty("data").GetArrayLength().Should().Be(0);
    }

    [Fact]
    public async Task Personalized_status_is_isolated_per_user()
    {
        var workItemId = Guid.NewGuid();
        var createdAt = DateTimeOffset.UtcNow.AddHours(-1);
        await ReplaceWorkItemsAsync(
            (new WorkItem { Id = workItemId, Title = "共用工作項目", CreatedAt = createdAt, UpdatedAt = createdAt },
             new UserWorkItemStatus
             {
                 UserId = UserId,
                 WorkItemId = workItemId,
                 Status = WorkItemStatus.Confirmed,
                 ConfirmedAt = createdAt,
                 UpdatedAt = createdAt
             }));

        var userToken = await LoginAsync("user", UserClientHash);
        var adminToken = await LoginAsync("admin", AdminClientHash);

        var userBody = await (await GetWorkItemsAsync(userToken)).Content.ReadFromJsonAsync<JsonElement>();
        var adminBody = await (await GetWorkItemsAsync(adminToken)).Content.ReadFromJsonAsync<JsonElement>();

        userBody.GetProperty("data").EnumerateArray().Single().GetProperty("status").GetString().Should().Be("Confirmed");
        adminBody.GetProperty("data").EnumerateArray().Single().GetProperty("status").GetString().Should().Be("Pending");
    }

    [Theory]
    [InlineData("asc", new[] { "較舊項目", "較新項目" })]
    [InlineData("desc", new[] { "較新項目", "較舊項目" })]
    public async Task Sorts_by_creation_time_in_the_requested_order(string sortOrder, string[] expectedTitles)
    {
        var older = new WorkItem
        {
            Id = Guid.NewGuid(),
            Title = "較舊項目",
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-2),
            UpdatedAt = DateTimeOffset.UtcNow.AddHours(-2)
        };
        var newer = new WorkItem
        {
            Id = Guid.NewGuid(),
            Title = "較新項目",
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-1),
            UpdatedAt = DateTimeOffset.UtcNow.AddHours(-1)
        };
        await ReplaceWorkItemsAsync((older, null), (newer, null));
        var token = await LoginAsync("user", UserClientHash);

        var response = await GetWorkItemsAsync(token, sortOrder);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        var titles = body.GetProperty("data").EnumerateArray()
            .Select(item => item.GetProperty("title").GetString())
            .ToArray();
        titles.Should().Equal(expectedTitles);
    }

    private async Task<string> LoginAsync(string username, string clientHash)
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", new { username, clientHash });
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("data").GetProperty("accessToken").GetString()!;
    }

    private async Task<HttpResponseMessage> GetWorkItemsAsync(string token, string? sortOrder = null)
    {
        var uri = sortOrder is null ? "/api/v1/work-items" : $"/api/v1/work-items?sortOrder={sortOrder}";
        using var request = new HttpRequestMessage(HttpMethod.Get, uri);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return await _client.SendAsync(request);
    }

    private async Task ReplaceWorkItemsAsync(params (WorkItem WorkItem, UserWorkItemStatus? Status)[] items)
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        context.UserWorkItemStatuses.RemoveRange(context.UserWorkItemStatuses);
        context.WorkItems.RemoveRange(context.WorkItems);
        await context.SaveChangesAsync();

        foreach (var (workItem, status) in items)
        {
            context.WorkItems.Add(workItem);
            if (status is not null)
            {
                context.UserWorkItemStatuses.Add(status);
            }
        }

        await context.SaveChangesAsync();
    }
}

public sealed class WorkItemsApiFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"work-items-tests-{Guid.NewGuid()}";

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
