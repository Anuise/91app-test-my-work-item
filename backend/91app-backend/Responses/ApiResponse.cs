using System.Text.Json.Serialization;

namespace _91app_backend.Responses;

public sealed record ApiResponse<T>(
    bool Success,
    T? Data,
    string Message,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    IReadOnlyList<string>? Errors = null,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    string? TraceId = null)
{
    public static ApiResponse<T> Ok(T data, string message) =>
        new(true, data, message);

    public static ApiResponse<T> Fail(string message, IReadOnlyList<string> errors, string traceId) =>
        new(false, default, message, errors, traceId);
}
