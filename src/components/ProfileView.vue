<!-- src/components/ProfileView.vue -->
<script setup lang="ts">
import type { UserResponse } from '../types';

defineProps<{
  user: UserResponse;
}>();
</script>

<template>
  <div class="max-w-3xl">
    <h2 class="text-2xl font-bold text-gray-800 mb-6">User Profile</h2>
    <el-descriptions border :column="1" class="bg-white shadow-sm rounded-lg">
      <el-descriptions-item label="User ID">{{ user.id }}</el-descriptions-item>
      <el-descriptions-item label="Email address">{{ user.email }}</el-descriptions-item>
      <el-descriptions-item label="Account Status">
        <el-tag :type="user.is_active ? 'success' : 'danger'">
          {{ user.is_active ? 'Active' : 'Inactive' }}
        </el-tag>
      </el-descriptions-item>
    </el-descriptions>
  </div>
</template>