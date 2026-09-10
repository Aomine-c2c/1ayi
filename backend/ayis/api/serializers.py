"""
AYIS — base serializers and the data-classification mixin.

Every serializer that carries derived data should expose a
`data_classification` field so the frontend can label results correctly.
"""

from rest_framework import serializers


class DataClassificationMixin:
    """
    Mixin that adds a read-only `data_classification` field.

    Concrete serializers override DATA_CLASSIFICATION or implement
    get_data_classification() to declare the classification of the
    resource they represent.
    """

    DATA_CLASSIFICATION = None

    def get_data_classification(self, obj):
        if self.DATA_CLASSIFICATION:
            return self.DATA_CLASSIFICATION
        return None

    data_classification = serializers.SerializerMethodField()

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        classification = self.get_data_classification(instance)
        if classification:
            representation["data_classification"] = classification
        return representation


class TimestampedSerializerMixin:
    """Adds created_at / updated_at as read-only fields when the model has them."""

    created_at = serializers.ReadOnlyField()
    updated_at = serializers.ReadOnlyField()
