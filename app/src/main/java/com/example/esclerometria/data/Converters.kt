package com.example.esclerometria.data

import androidx.room.TypeConverter
import com.example.esclerometria.model.TestPhoto

class Converters {

    @TypeConverter
    fun fromIntList(list: List<Int>?): String {
        return list?.joinToString(",") ?: ""
    }

    @TypeConverter
    fun toIntList(data: String?): List<Int> {
        if (data.isNullOrBlank()) return emptyList()
        return data.split(",").mapNotNull { it.trim().toIntOrNull() }
    }

    @TypeConverter
    fun fromPhotosList(photos: List<TestPhoto>?): String {
        if (photos.isNullOrEmpty()) return ""
        // Format: id|||dataUrl|||caption|||timestamp###...
        return photos.joinToString("###") { "${it.id}|||${it.dataUrl}|||${it.caption}|||${it.timestamp}" }
    }

    @TypeConverter
    fun toPhotosList(data: String?): List<TestPhoto> {
        if (data.isNullOrBlank()) return emptyList()
        return data.split("###").mapNotNull { item ->
            val parts = item.split("|||")
            if (parts.size >= 4) {
                TestPhoto(
                    id = parts[0],
                    dataUrl = parts[1],
                    caption = parts[2],
                    timestamp = parts[3].toLongOrNull() ?: System.currentTimeMillis()
                )
            } else null
        }
    }
}
