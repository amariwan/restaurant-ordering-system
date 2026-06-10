using System;
using System.IO;
using System.Threading.Tasks;
using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Util;
using Amazon.Runtime;
using RestaurantApp.Core.Interfaces;
using Microsoft.Extensions.Configuration;

namespace RestaurantApp.Infrastructure.Services;

public class S3FileStorage : IFileStorage
{
    private readonly string _bucket;
    private readonly string? _region;
    private readonly IAmazonS3 _client;
    private readonly string? _endpoint;

    public S3FileStorage(IConfiguration config)
    {
        _bucket = config["AWS_S3_BUCKET"] ?? config["S3_BUCKET_NAME"] ?? config["MINIO_BUCKET"] ?? throw new ArgumentException("S3 bucket is not configured (AWS_S3_BUCKET / S3_BUCKET_NAME / MINIO_BUCKET)");
        _region = config["AWS_REGION"] ?? config["AWS_S3_REGION"];

        // Support custom S3 endpoint (MinIO or other S3-compatible services)
        _endpoint = config["S3_ENDPOINT"] ?? config["AWS_S3_ENDPOINT"] ?? config["MINIO_ENDPOINT"];

        var accessKey = config["AWS_ACCESS_KEY_ID"] ?? config["AWS_ACCESS_KEY"] ?? config["MINIO_ACCESS_KEY"] ?? config["MINIO_ROOT_USER"];
        var secretKey = config["AWS_SECRET_ACCESS_KEY"] ?? config["AWS_SECRET"] ?? config["MINIO_SECRET_KEY"] ?? config["MINIO_ROOT_PASSWORD"];

        if (!string.IsNullOrEmpty(_endpoint))
        {
            var s3Config = new AmazonS3Config
            {
                ServiceURL = _endpoint,
                ForcePathStyle = true
            };

            if (!string.IsNullOrEmpty(accessKey) && !string.IsNullOrEmpty(secretKey))
            {
                var creds = new BasicAWSCredentials(accessKey, secretKey);
                _client = new AmazonS3Client(creds, s3Config);
            }
            else
            {
                _client = new AmazonS3Client(s3Config);
            }
        }
        else
        {
            var regionName = _region ?? "us-east-1";
            var regionEndpoint = RegionEndpoint.GetBySystemName(regionName);

            if (!string.IsNullOrEmpty(accessKey) && !string.IsNullOrEmpty(secretKey))
            {
                var creds = new BasicAWSCredentials(accessKey, secretKey);
                _client = new AmazonS3Client(creds, regionEndpoint);
            }
            else
            {
                _client = new AmazonS3Client(regionEndpoint);
            }
        }
    }

    public async Task<string> UploadFileAsync(Stream stream, string fileName, string contentType)
    {
        var ext = Path.GetExtension(fileName) ?? string.Empty;
        var key = $"uploads/{Guid.NewGuid():N}{ext}";

        // Ensure bucket exists (create if necessary)
        try
        {
            var exists = await AmazonS3Util.DoesS3BucketExistV2Async(_client, _bucket);
            if (!exists)
            {
                await _client.PutBucketAsync(new PutBucketRequest { BucketName = _bucket });
            }
        }
        catch
        {
            // ignore bucket check/create errors; PutObject may still succeed if bucket exists or permissions allow
        }

        var put = new PutObjectRequest
        {
            BucketName = _bucket,
            Key = key,
            InputStream = stream,
            ContentType = contentType,
            CannedACL = S3CannedACL.PublicRead
        };

        await _client.PutObjectAsync(put);

        // Construct a public URL for the uploaded object.
        if (!string.IsNullOrEmpty(_endpoint))
        {
            // For S3-compatible endpoints (MinIO), use path-style URL
            var baseUrl = _endpoint.TrimEnd('/');
            return $"{baseUrl}/{_bucket}/{key}";
        }

        var region = _region ?? "us-east-1";
        var url = $"https://{_bucket}.s3.{region}.amazonaws.com/{key}";
        return url;
    }
}
