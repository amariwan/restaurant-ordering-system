using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantApp.Infrastructure.Migrations
{
    public partial class EnhancedTableFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ColorHex",
                table: "Tables",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Tables",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Height",
                table: "Tables",
                type: "integer",
                nullable: false,
                defaultValue: 72);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Tables",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "Rotation",
                table: "Tables",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Shape",
                table: "Tables",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "Tables",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Width",
                table: "Tables",
                type: "integer",
                nullable: false,
                defaultValue: 72);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "ColorHex", table: "Tables");
            migrationBuilder.DropColumn(name: "Description", table: "Tables");
            migrationBuilder.DropColumn(name: "Height", table: "Tables");
            migrationBuilder.DropColumn(name: "IsActive", table: "Tables");
            migrationBuilder.DropColumn(name: "Rotation", table: "Tables");
            migrationBuilder.DropColumn(name: "Shape", table: "Tables");
            migrationBuilder.DropColumn(name: "Type", table: "Tables");
            migrationBuilder.DropColumn(name: "Width", table: "Tables");
        }
    }
}
