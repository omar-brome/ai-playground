using System;
using System.IO;
using UnityEngine;

public static class WavUtility
{
    public static byte[] FromAudioClip(AudioClip clip, out string error)
    {
        error = null;
        if (clip == null)
        {
            error = "null clip";
            return Array.Empty<byte>();
        }

        var samples = new float[clip.samples * clip.channels];
        clip.GetData(samples, 0);

        using var ms = new MemoryStream(44 + samples.Length * 2);
        var hz = clip.frequency;
        var ch = (ushort)clip.channels;
        WriteHeader(ms, (uint)(samples.Length * 2), hz, ch);

        for (var i = 0; i < samples.Length; i++)
        {
            var s = (short)(Mathf.Clamp(samples[i], -1f, 1f) * short.MaxValue);
            ms.WriteByte((byte)(s & 0xff));
            ms.WriteByte((byte)((s >> 8) & 0xff));
        }

        return ms.ToArray();
    }

    static void WriteHeader(Stream stream, uint dataLength, int hz, ushort channels)
    {
        var blockAlign = (ushort)(channels * 2);
        var byteRate = (uint)(hz * blockAlign);

        void W(string s)
        {
            foreach (var c in s)
                stream.WriteByte((byte)c);
        }

        W("RIFF");
        WriteUInt(stream, 36 + dataLength);
        W("WAVE");
        W("fmt ");
        WriteUInt(stream, 16);
        WriteUShort(stream, 1);
        WriteUShort(stream, channels);
        WriteUInt(stream, (uint)hz);
        WriteUInt(stream, byteRate);
        WriteUShort(stream, blockAlign);
        WriteUShort(stream, 16);
        W("data");
        WriteUInt(stream, dataLength);
    }

    static void WriteUInt(Stream s, uint v)
    {
        s.WriteByte((byte)(v & 0xff));
        s.WriteByte((byte)((v >> 8) & 0xff));
        s.WriteByte((byte)((v >> 16) & 0xff));
        s.WriteByte((byte)((v >> 24) & 0xff));
    }

    static void WriteUShort(Stream s, ushort v)
    {
        s.WriteByte((byte)(v & 0xff));
        s.WriteByte((byte)((v >> 8) & 0xff));
    }
}
