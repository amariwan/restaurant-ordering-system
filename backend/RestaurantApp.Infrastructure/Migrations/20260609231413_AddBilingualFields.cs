using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBilingualFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Name",
                table: "MenuItems",
                newName: "NameKu");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "MenuItems",
                newName: "DescriptionKu");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "Categories",
                newName: "NameKu");

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Payments",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PaymentStatus",
                table: "Orders",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "DescriptionEn",
                table: "MenuItems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NameEn",
                table: "MenuItems",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "NameEn",
                table: "Categories",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Status",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "PaymentStatus",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "DescriptionEn",
                table: "MenuItems");

            migrationBuilder.DropColumn(
                name: "NameEn",
                table: "MenuItems");

            migrationBuilder.DropColumn(
                name: "NameEn",
                table: "Categories");

            migrationBuilder.RenameColumn(
                name: "NameKu",
                table: "MenuItems",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "DescriptionKu",
                table: "MenuItems",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "NameKu",
                table: "Categories",
                newName: "Name");
        }
    }
}
