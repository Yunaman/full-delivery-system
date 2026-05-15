import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Product, ProductReview

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Product)
def log_product_creation(sender, instance, created, **kwargs):
    """
    Log when a new product is created.
    """
    if created:
        logger.info(f"New product created: {instance.name} (Vendor: {instance.vendor.shop_name})")


@receiver(post_save, sender=ProductReview)
def update_product_rating(sender, instance, created, **kwargs):
    """
    Update product rating when a new review is added.
    """
    if created:
        from django.db.models import Avg
        product = instance.product
        avg_rating = ProductReview.objects.filter(product=product).aggregate(
            Avg('rating')
        )['rating__avg']
        
        product.rating = avg_rating or 0
        product.total_reviews = ProductReview.objects.filter(product=product).count()
        product.save(update_fields=['rating', 'total_reviews'])
        
        logger.info(f"New review added for {product.name}: {instance.rating} stars")
