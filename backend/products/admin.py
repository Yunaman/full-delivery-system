from django.contrib import admin

from .models import Category, Product, ProductImage, ProductReview, ProductVariant


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_active', 'display_order', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'vendor', 'category', 'price', 'stock_quantity',
        'is_available', 'is_featured', 'rating', 'created_at'
    ]
    list_filter = [
        'is_available', 'is_featured', 'product_type',
        'category', 'created_at'
    ]
    search_fields = ['name', 'description', 'sku', 'vendor__shop_name']
    raw_id_fields = ['vendor', 'category']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductVariantInline, ProductImageInline]
    date_hierarchy = 'created_at'
    
    fieldsets = (
        (None, {
            'fields': ('vendor', 'name', 'slug', 'category', 'product_type')
        }),
        ('Pricing', {
            'fields': ('price', 'discount_price')
        }),
        ('Inventory', {
            'fields': ('stock_quantity', 'sku', 'barcode', 'weight')
        }),
        ('Media', {
            'fields': ('image',)
        }),
        ('Details', {
            'fields': ('description', 'preparation_time', 'calories', 'allergens', 'dietary_info')
        }),
        ('Status', {
            'fields': ('is_available', 'is_featured')
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description'),
            'classes': ('collapse',)
        }),
        ('Statistics', {
            'fields': ('rating', 'total_reviews', 'total_sales'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['rating', 'total_reviews', 'total_sales']


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ['product', 'name', 'price_adjustment', 'stock_quantity', 'is_available']
    list_filter = ['is_available']
    search_fields = ['name', 'product__name']
    raw_id_fields = ['product']


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'customer', 'rating', 'is_verified_purchase', 'created_at']
    list_filter = ['rating', 'is_verified_purchase', 'created_at']
    search_fields = ['product__name', 'customer__name', 'comment']
    raw_id_fields = ['product', 'customer']
