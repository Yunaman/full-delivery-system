from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import ProtectedError
from django.test import TestCase

from drivers.models import Driver, DriverPayout

User = get_user_model()


class DriverDataProtectionTests(TestCase):
    """Test driver data protection and payout retention."""

    def setUp(self):
        self.driver_user = User.objects.create_user(
            email='driver_prot@example.com',
            name='Protected Driver',
            password='pass123',
            role='driver'
        )

        self.driver = Driver.objects.create(
            user=self.driver_user,
            vehicle_type='motorcycle',
            vehicle_number='MTR-1234'
        )

    def test_cannot_delete_driver_with_payouts(self):
        """Verify driver profile with payout history cannot be deleted."""
        DriverPayout.objects.create(
            driver=self.driver,
            amount=Decimal('150.00'),
            method='bank_transfer',
            status='completed'
        )

        with self.assertRaises(ProtectedError):
            self.driver.delete()

    def test_deactivating_driver_preserves_profile_and_payouts(self):
        """Verify soft deactivating driver preserves profile and payout records."""
        payout = DriverPayout.objects.create(
            driver=self.driver,
            amount=Decimal('200.00'),
            method='bank_transfer',
            status='completed'
        )

        self.driver.is_active = False
        self.driver.save()

        payout.refresh_from_db()
        self.assertEqual(payout.driver, self.driver)
        self.assertFalse(payout.driver.is_active)
