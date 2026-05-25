from datetime import datetime, timezone
from types import SimpleNamespace

from django.test import SimpleTestCase

from .views import (
    AIProcessor,
    build_audio_cache_filename,
    estimate_minutes,
    normalize_page_range,
    parse_bool_param,
    parse_positive_int,
    select_balanced_chunk_indexes,
)


class FeatureHelperTests(SimpleTestCase):
    def test_parse_positive_int_uses_default_when_missing(self):
        self.assertEqual(parse_positive_int(None, 'start_page', default=3), 3)

    def test_parse_positive_int_rejects_invalid_values(self):
        with self.assertRaisesMessage(ValueError, 'start_page must be a whole number.'):
            parse_positive_int('abc', 'start_page')

        with self.assertRaisesMessage(ValueError, 'start_page must be at least 1.'):
            parse_positive_int(0, 'start_page')

    def test_normalize_page_range_clamps_valid_range(self):
        self.assertEqual(normalize_page_range(2, 5, 12), (2, 5))

    def test_normalize_page_range_rejects_inverted_range(self):
        with self.assertRaisesMessage(ValueError, 'start_page cannot be greater than end_page.'):
            normalize_page_range(8, 3, 12)

    def test_normalize_page_range_enforces_max_page_window(self):
        with self.assertRaisesMessage(ValueError, 'You can only request up to 20 pages at a time.'):
            normalize_page_range(1, 25, 30, max_pages=20)

    def test_parse_bool_param_accepts_common_truthy_values(self):
        self.assertTrue(parse_bool_param('true'))
        self.assertTrue(parse_bool_param('1'))
        self.assertFalse(parse_bool_param('false'))
        self.assertFalse(parse_bool_param(None))

    def test_estimate_minutes_rounds_up(self):
        self.assertEqual(estimate_minutes(1, 150), 1)
        self.assertEqual(estimate_minutes(151, 150), 2)
        self.assertEqual(estimate_minutes(0, 150), 0)

    def test_build_audio_cache_filename_includes_book_version(self):
        book = SimpleNamespace(
            id=7,
            updated_at=datetime(2026, 5, 20, 12, 0, tzinfo=timezone.utc),
        )
        filename = build_audio_cache_filename(book, 'chapter_audio', 2, 6)

        self.assertEqual(filename, 'book_7_chapter_audio_2_6_v1779278400.mp3')

    def test_select_balanced_chunk_indexes_spans_full_range(self):
        self.assertEqual(select_balanced_chunk_indexes(7, 4), [0, 2, 4, 6])

    def test_build_summary_source_text_samples_large_input(self):
        text = ' '.join(f'word{i}' for i in range(12000))

        summary_source, source_is_sampled = AIProcessor.build_summary_source_text(
            text,
            max_input_chars=2000,
            max_chunks=4,
        )

        self.assertTrue(source_is_sampled)
        self.assertLessEqual(len(summary_source), 2000)
        self.assertIn('word0', summary_source)
        self.assertIn('word11999', summary_source)
