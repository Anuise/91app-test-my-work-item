using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using _91app_backend.Contracts;
using _91app_backend.Responses;
using _91app_backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace _91app_backend.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController(
    IAuthService authService,
    ILogger<AuthController> logger) : ControllerBase
{
    [HttpPost("login")]
    [ProducesResponseType<ApiResponse<LoginResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiResponse<object>>(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Username) ||
            string.IsNullOrWhiteSpace(request.ClientHash) ||
            request.ClientHash.Length != 64 ||
            !request.ClientHash.All(Uri.IsHexDigit))
        {
            logger.LogWarning(
                "登入資料格式錯誤。Username: {Username}, Action: {Action}, StatusCode: {StatusCode}",
                request.Username,
                "Login",
                StatusCodes.Status400BadRequest);
            return BadRequest(ApiResponse<object>.Fail(
                "登入資料格式不正確",
                ["帳號與 64 字元 ClientHash 為必填"],
                HttpContext.TraceIdentifier));
        }

        var response = await authService.LoginAsync(request, cancellationToken);
        if (response is null)
        {
            logger.LogWarning(
                "登入驗證失敗。Username: {Username}, Action: {Action}, StatusCode: {StatusCode}",
                request.Username,
                "Login",
                StatusCodes.Status401Unauthorized);
            return Unauthorized(ApiResponse<object>.Fail(
                "帳號或密碼錯誤",
                ["提供的登入資訊無法驗證"],
                HttpContext.TraceIdentifier));
        }

        logger.LogInformation(
            "登入成功。UserId: {UserId}, Role: {Role}, Action: {Action}, StatusCode: {StatusCode}",
            response.User.Id,
            response.User.Role,
            "Login",
            StatusCodes.Status200OK);
        return Ok(ApiResponse<LoginResponse>.Ok(response, "登入成功"));
    }

    [HttpGet("session")]
    [Authorize]
    [ProducesResponseType<ApiResponse<AuthenticatedUser>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiResponse<object>>(StatusCodes.Status401Unauthorized)]
    public ActionResult<ApiResponse<AuthenticatedUser>> Session()
    {
        var subject = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        var name = User.FindFirstValue("name");
        var role = User.FindFirstValue("role");
        if (!Guid.TryParse(subject, out var userId) || name is null || role is null)
        {
            return Unauthorized(ApiResponse<object>.Fail(
                "登入狀態無效",
                ["Token identity claims are incomplete"],
                HttpContext.TraceIdentifier));
        }

        return Ok(ApiResponse<AuthenticatedUser>.Ok(
            new AuthenticatedUser(userId, name, role),
            "登入狀態有效"));
    }
}
