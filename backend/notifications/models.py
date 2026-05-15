import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _


class Notification(models.Model):
    """
    Notification model for user alerts.
    """
    
    class Type(models.TextChoices):
        ORDER = 'order', _('Order')
        PAYMENT = 'payment', _('Payment')
        DELIVERY = 'delivery', _('Delivery')
        PROMOTION = 'promotion', _('Promotion')
        SYSTEM = 'system', _('System')
    
    class Priority(models.TextChoices):
        LOW = 'low', _('Low')
        MEDIUM = 'medium', _('Medium')
        HIGH = 'high', _('High')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    recipient = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    
    type = models.CharField(
        max_length=20,
        choices=Type.choices,
        default=Type.SYSTEM
    )
    
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    data = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Additional data for the notification')
    )
    
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM
    )
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    
    action_url = models.CharField(max_length=500, blank=True)
    
    sent_via_push = models.BooleanField(default=False)
    sent_via_email = models.BooleanField(default=False)
    sent_via_sms = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('notification')
        verbose_name_plural = _('notifications')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['type', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.recipient.name} - {self.title}"
    
    def mark_as_read(self):
        """Mark notification as read."""
        from django.utils import timezone
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])


class PushSubscription(models.Model):
    """
    Push notification subscription model.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='push_subscriptions'
    )
    
    endpoint = models.URLField()
    p256dh = models.CharField(max_length=255)
    auth = models.CharField(max_length=255)
    
    device_info = models.CharField(max_length=255, blank=True)
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('push subscription')
        verbose_name_plural = _('push subscriptions')
        unique_together = ['user', 'endpoint']
    
    def __str__(self):
        return f"{self.user.name} - {self.device_info}"
