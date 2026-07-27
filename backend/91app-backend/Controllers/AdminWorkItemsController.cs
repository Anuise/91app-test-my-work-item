using _91app_backend.Contracts;
using _91app_backend.Responses;
using _91app_backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace _91app_backend.Controllers;

[ApiController]
[Route("api/v1/admin/work-items")]
[Authorize(Roles = "Admin")]
public sealed class AdminWorkItemsController(IWorkItemService workItemService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<ApiResponse<IReadOnlyList<AdminWorkItemListItem>>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiResponse<object>>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ApiResponse<object>>(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetWorkItems(CancellationToken cancellationToken)
    {
        var items = await workItemService.GetAdminWorkItemsAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<AdminWorkItemListItem>>.Ok(items, "取得管理工作項目列表成功"));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<ApiResponse<AdminWorkItemListItem>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiResponse<object>>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ApiResponse<object>>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ApiResponse<object>>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetWorkItem(
        Guid id,
        CancellationToken cancellationToken)
    {
        var item = await workItemService.GetAdminWorkItemAsync(id, cancellationToken);
        if (item is null)
        {
            return NotFound(ApiResponse<object>.Fail(
                "找不到工作項目",
                ["Work item not found"],
                HttpContext.TraceIdentifier));
        }

        return Ok(ApiResponse<AdminWorkItemListItem>.Ok(item, "取得工作項目成功"));
    }

    [HttpPost]
    [ProducesResponseType<ApiResponse<CreatedWorkItem>>(StatusCodes.Status201Created)]
    [ProducesResponseType<ApiResponse<object>>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ApiResponse<object>>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ApiResponse<object>>(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateWorkItem(
        CreateWorkItemRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(ApiResponse<object>.Fail(
                "建立工作項目失敗",
                ["title 不可為空白"],
                HttpContext.TraceIdentifier));
        }

        var description = string.IsNullOrWhiteSpace(request.Description)
            ? null
            : request.Description.Trim();
        var created = await workItemService.CreateAsync(
            request.Title.Trim(),
            description,
            cancellationToken);
        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<CreatedWorkItem>.Ok(created, "建立工作項目成功"));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType<ApiResponse<UpdatedWorkItem>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiResponse<object>>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ApiResponse<object>>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ApiResponse<object>>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ApiResponse<object>>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateWorkItem(
        Guid id,
        UpdateWorkItemRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(ApiResponse<object>.Fail(
                "更新工作項目失敗",
                ["title 不可為空白"],
                HttpContext.TraceIdentifier));
        }

        var description = string.IsNullOrWhiteSpace(request.Description)
            ? null
            : request.Description.Trim();
        var updated = await workItemService.UpdateAsync(
            id,
            request.Title.Trim(),
            description,
            cancellationToken);
        if (updated is null)
        {
            return NotFound(ApiResponse<object>.Fail(
                "找不到工作項目",
                ["Work item not found"],
                HttpContext.TraceIdentifier));
        }

        return Ok(ApiResponse<UpdatedWorkItem>.Ok(updated, "更新工作項目成功"));
    }
}
