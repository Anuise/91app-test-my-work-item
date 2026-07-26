using Serilog.Context;

namespace _91app_backend;

public sealed class TraceIdMiddleware(RequestDelegate next)
{
    private const string HeaderName = "X-Trace-ID";

    public async Task InvokeAsync(HttpContext context)
    {
        var traceId = context.Request.Headers.TryGetValue(HeaderName, out var requestedTraceId) &&
                      !string.IsNullOrWhiteSpace(requestedTraceId)
            ? requestedTraceId.ToString()
            : Guid.NewGuid().ToString("N");

        context.TraceIdentifier = traceId;
        context.Response.Headers[HeaderName] = traceId;
        using var logContext = LogContext.PushProperty("TraceId", traceId);
        await next(context);
    }
}
