<script setup lang="ts">
import { getHTTPGetResponse } from "@/composables/useHTTPMethods";
import moment from "moment";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();
const headers = [
  { title: "Created At", key: "date" },
  { title: "Title", key: "title" },
  { title: "Description", key: "description" },
  { title: "Actions", key: "actions" },
]
const blogs = ref([]);

const getBlogs = async () => {
  const response = await getHTTPGetResponse("/blogs");
  if (response) {
    blogs.value = response?.results;
    console.log("blogs.value: ", blogs.value);
  }
}

const viewBlog = (id: number) => {
  console.log(id);
  router.push(`/blogs/view/${id}`);
}

const editBlog = (id: number) => {
  console.log(id);
  router.push(`/blogs/edit/${id}`);
}

const deleteBlog = (id: number) => {
  console.log(id);
}

onMounted(async () => {
  getBlogs()
});

</script>

<template>
  <div>
    <VCard title="Blogs">
      <VCardTitle>
        <VBtn to="/blogs/add-blog" class="float-end" color="primary" size="small">
          <VIcon icon="tabler-plus" start class="mr-2" />
          Add Blog
        </VBtn>
      </VCardTitle>
      <VDataTable :headers="headers" :items="blogs" :items-per-page="5">
        <template #item.date="{ item }">
          {{ moment(item.created_at).format("DD-MM-YYYY") }}
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex gap-2">
            <VIcon icon="tabler-eye cursor-pointer" size="24" color="success" @click="viewBlog(item.id)" />
            <VIcon icon="tabler-edit cursor-pointer" size="24" color="warning" @click="editBlog(item.id)" />
            <VIcon icon="tabler-trash cursor-pointer" size="24" color="error" @click="deleteBlog(item.id)" />
          </div>
        </template>
      </VDataTable>
    </VCard>
  </div>
</template>

<style lang="scss" scoped></style>
