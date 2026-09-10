"""
AYIS management commands — seed data generation.
"""
from django.core.management.base import BaseCommand
from ayis.seed_data import seed_all


class Command(BaseCommand):
    help = "Seed the database with realistic development data using Faker."

    def handle(self, *args, **options):
        result = seed_all()
        self.stdout.write(self.style.SUCCESS("\nSeed complete!"))
        for k, v in result.items():
            self.stdout.write(f"  {k}: {v}")
