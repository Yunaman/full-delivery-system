import uuid

from django.core.validators import MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _


class Category(models.Model):
    """
    Product category model.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(_('name'), max_length=100, unique=True)
    slug = models.SlugField(_('slug'), max_length=100, unique=True)
    description = models.TextField(_('description'), blank=True)
    icon = models.ImageField(
        _('icon'),
        upload_to='category_icons/',
        blank=True,
        null=True
    )
    image = models.ImageField(
        _('image'),
        upload_to='category_images/',
        blank=True,
        null=True
    )
    is_active = models.BooleanField(_('is active'), default=True)
    display_order = models.PositiveIntegerField(_('display order'), default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('category')
        verbose_name_plural = _('categories')
        ordering = ['display_order', 'name']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Product(models.Model):
    """
    Product model for items sold by vendors.
    """
    
    class ProductType(models.TextChoices):
        PHYSICAL = 'physical', _('Physical Product')
        DIGITAL = 'digital', _('Digital Product')
        SERVICE = 'service', _('Service')
        FOOD = 'food', _('Food Item')
        BEVERAGE = 'beverage', _('Beverage')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.CASCADE,
        related_name='products',
        verbose_name=_('vendor')
    )
    
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        related_name='products',
        null=True,
        blank=True,
        verbose_name=_('category')
    )
    
    name = models.CharField(_('product name'), max_length=255)
    slug = models.SlugField(_('slug'), max_length=255, blank=True)
    
    description = models.TextField(_('description'), blank=True)
    
    product_type = models.CharField(
        _('product type'),
        max_length=20,
        choices=ProductType.choices,
        default=ProductType.PHYSICAL
    )
    
    price = models.DecimalField(
        _('price'),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    
    discount_price = models.DecimalField(
        _('discount price'),
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(0)]
    )
    
    image = models.ImageField(
        _('product image'),
        upload_to='product_images/',
        blank=True,
        null=True
    )
    
    stock_quantity = models.PositiveIntegerField(
        _('stock quantity'),
        default=0
    )
    
    is_available = models.BooleanField(_('is available'), default=True)
    is_featured = models.BooleanField(_('is featured'), default=False)
    
    preparation_time = models.PositiveIntegerField(
        _('preparation time (minutes)'),
        default=0,
        help_text=_('Time required to prepare this item')
    )
    
    calories = models.PositiveIntegerField(
        _('calories'),
        blank=True,
        null=True
    )
    
    allergens = models.JSONField(
        _('allergens'),
        default=list,
        blank=True,
        help_text=_('List of allergens, e.g., ["nuts", "dairy", "gluten"]')
    )
    
    dietary_info = models.JSONField(
        _('dietary information'),
        default=dict,
        blank=True,
        help_text=_('Dietary flags like {"vegetarian": true, "vegan": false}')
    )
    
    sku = models.CharField(
        _('SKU'),
        max_length=50,
        blank=True,
        help_text=_('Stock Keeping Unit')
    )
    
    barcode = models.CharField(
        _('barcode'),
        max_length=50,
        blank=True
    )
    
    weight = models.DecimalField(
        _('weight (kg)'),
        max_digits=8,
        decimal_places=3,
        blank=True,
        null=True
    )
    
    rating = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        default=0.0
    )
    
    total_reviews = models.PositiveIntegerField(default=0)
    total_sales = models.PositiveIntegerField(default=0)
    
    meta_title = models.CharField(_('meta title'), max_length=255, blank=True)
    meta_description = models.TextField(_('meta description'), blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('product')
        verbose_name_plural = _('products')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['vendor', 'is_available']),
            models.Index(fields=['category']),
            models.Index(fields=['is_featured']),
            models.Index(fields=['price']),
            models.Index(fields=['slug']),
        ]
        unique_together = ['vendor', 'slug']
    
    def __str__(self):
        return f"{self.name} ({self.vendor.shop_name})"
    
    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    @property
    def current_price(self):
        """Return the current price (discount price if available, else regular price)."""
        return self.discount_price if self.discount_price else self.price
    
    @property
    def discount_percentage(self):
        """Calculate discount percentage if discount price is set."""
        if self.discount_price and self.price > 0:
            return round(((self.price - self.discount_price) / self.price) * 100, 1)
        return 0
    
    @property
    def in_stock(self):
        """Check if product is in stock."""
        return self.stock_quantity > 0 or self.product_type in ['service', 'digital']


class ProductVariant(models.Model):
    """
    Product variants (size, color, etc.) for products.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='variants'
    )
    
    name = models.CharField(_('variant name'), max_length=100)
    
    price_adjustment = models.DecimalField(
        _('price adjustment'),
        max_digits=10,
        decimal_places=2,
        default=0
    )
    
    stock_quantity = models.PositiveIntegerField(
        _('stock quantity'),
        default=0
    )
    
    is_available = models.BooleanField(_('is available'), default=True)
    
    sku = models.CharField(_('SKU'), max_length=50, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('product variant')
        verbose_name_plural = _('product variants')
        ordering = ['name']
        unique_together = ['product', 'name']
    
    def __str__(self):
        return f"{self.product.name} - {self.name}"
    
    @property
    def final_price(self):
        """Calculate final price including adjustment."""
        return self.product.current_price + self.price_adjustment


class ProductReview(models.Model):
    """
    Customer reviews for products.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    
    customer = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='product_reviews'
    )
    
    rating = models.PositiveSmallIntegerField(
        choices=[(i, i) for i in range(1, 6)]
    )
    
    comment = models.TextField(blank=True)
    
    is_verified_purchase = models.BooleanField(
        _('verified purchase'),
        default=False
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('product review')
        verbose_name_plural = _('product reviews')
        ordering = ['-created_at']
        unique_together = ['product', 'customer']
    
    def __str__(self):
        return f"{self.customer.name} rated {self.product.name}: {self.rating}"


class ProductImage(models.Model):
    """
    Additional images for products.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='additional_images'
    )
    
    image = models.ImageField(
        _('image'),
        upload_to='product_gallery/'
    )
    
    alt_text = models.CharField(_('alt text'), max_length=255, blank=True)
    
    display_order = models.PositiveIntegerField(_('display order'), default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('product image')
        verbose_name_plural = _('product images')
        ordering = ['display_order']
    
    def __str__(self):
        return f"Image for {self.product.name}"
