import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSelfCompareLabel,
  formatRecordingDuration,
  pickSupportedAudioMimeType,
} from './audioRecorder';

test('formatRecordingDuration formats seconds as MM:SS', () => {
  assert.equal(formatRecordingDuration(0), '00:00');
  assert.equal(formatRecordingDuration(9), '00:09');
  assert.equal(formatRecordingDuration(65), '01:05');
  assert.equal(formatRecordingDuration(-4), '00:00');
});

test('pickSupportedAudioMimeType chooses preferred supported codec safely', () => {
  assert.equal(pickSupportedAudioMimeType(undefined), undefined);
  assert.equal(
    pickSupportedAudioMimeType((mime) => mime === 'audio/mp4'),
    'audio/mp4'
  );
  assert.equal(
    pickSupportedAudioMimeType((mime) => mime.startsWith('audio/webm')),
    'audio/webm;codecs=opus'
  );
  assert.equal(
    pickSupportedAudioMimeType(() => false),
    undefined
  );
});

test('buildSelfCompareLabel strips duplicate surah suffix cleanly', () => {
  assert.equal(buildSelfCompareLabel('Fatihə surəsi', '1:2', 14), 'Fatihə 1:2 · 00:14');
  assert.equal(buildSelfCompareLabel('İxlas', '112:1', 3), 'İxlas 112:1 · 00:03');
});
