# Generated by Django 4.2 on 2025-06-21 19:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_library'),
    ]

    operations = [
        migrations.AddField(
            model_name='book',
            name='total_pages',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
