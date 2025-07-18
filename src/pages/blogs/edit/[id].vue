<script setup lang="ts">
import TipTapEditor from '@/components/editor/TipTapEditor.vue'
import { getHTTPGetResponse, getHTTPPutResponse } from '@/composables/useHTTPMethods'
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const blogId = route.params.id

const formData = ref({
    title: '',
    description: '',
    content: '',
    seo_meta_tags: '',
    seo_description: ''
})

const isFormValid = ref(false)
const hasSubmitted = ref(false)
const isSubmitting = ref(false)
const isLoading = ref(true)
const error = ref('')

const validateContent = () => {
    const hasContent = formData.value.content && formData.value.content.trim() !== '' && formData.value.content !== '<p></p>'
    return hasContent
}

const fetchBlogData = async () => {
    try {
        isLoading.value = true
        const response = await getHTTPGetResponse(`/blogs/${blogId}/`)
        if (response) {
            formData.value = {
                title: response.title || '',
                description: response.description || '',
                content: response.content || '',
                seo_meta_tags: response.seo_meta_tags || '',
                seo_description: response.seo_description || ''
            }
        }
    } catch (err) {
        console.error('Error fetching blog data:', err)
        error.value = 'Failed to load blog data. Please try again.'
    } finally {
        isLoading.value = false
    }
}

const handleSubmit = async () => {
    hasSubmitted.value = true

    // Validate all required fields
    if (!formData.value.title || !formData.value.description || !validateContent() ||
        !formData.value.seo_meta_tags?.length || !formData.value.seo_description) {
        return
    }

    isSubmitting.value = true
    error.value = ''

    try {
        const response = await getHTTPPutResponse(`/blogs/${blogId}/`, formData.value, true)
        if (response) {
            // Redirect to blog list after successful update
            router.push('/blogs')
        }
    } catch (err) {
        console.error('Error updating blog:', err)
        error.value = 'Failed to update blog. Please try again.'
    } finally {
        isSubmitting.value = false
    }
}

onMounted(() => {
    fetchBlogData()
})
</script>

<template>
    <div>
        <VCard>
            <VCardItem class="d-flex align-center justify-space-between">
                <VCardTitle>Edit Blog Post</VCardTitle>
            </VCardItem>

            <VCardText>
                <VAlert
                    v-if="error"
                    type="error"
                    variant="tonal"
                    class="mb-4"
                >
                    {{ error }}
                </VAlert>

                <VProgressLinear
                    v-if="isLoading"
                    indeterminate
                    color="primary"
                    class="mb-4"
                />

                <VForm v-else v-model="isFormValid" @submit.prevent="handleSubmit">
                    <VRow>
                        <VCol cols="12">
                            <VTextField 
                                v-model="formData.title" 
                                label="Title"
                                :rules="[v => !!v || 'Title is required']" 
                                required 
                            />
                        </VCol>

                        <VCol cols="12">
                            <VTextarea 
                                v-model="formData.description" 
                                label="Description" 
                                rows="3"
                                :rules="[v => !!v || 'Description is required']" 
                                required 
                            />
                        </VCol>

                        <VCol cols="12">
                            <VLabel class="mb-2">Content <span class="text-error">*</span></VLabel>
                            <TipTapEditor 
                                v-model="formData.content"
                                placeholder="Start writing your blog post here..." 
                            />
                            <div v-if="hasSubmitted && !validateContent()" class="text-error text-caption mt-1">
                                Content is required
                            </div>
                        </VCol>

                        <VCol cols="12" md="6">
                            <VTextField 
                                v-model="formData.seo_meta_tags" 
                                label="SEO Meta Tags" 
                                hint="Enter tags separated by commas (e.g., tag1, tag2, tag3)"
                                :rules="[v => !!v || 'SEO Meta Tags are required']" 
                                required 
                            />
                        </VCol>

                        <VCol cols="12" md="6">
                            <VTextField 
                                v-model="formData.seo_description" 
                                label="SEO Meta Description"
                                :rules="[v => !!v || 'SEO Meta Description is required']" 
                                required 
                            />
                        </VCol>

                        <VCol cols="12" class="d-flex gap-4">
                            <VBtn 
                                type="submit" 
                                color="primary" 
                                :loading="isSubmitting"
                                :disabled="!isFormValid || isSubmitting"
                            >
                                <VIcon start icon="tabler-edit" />
                                Update Post
                            </VBtn>

                            <VBtn 
                                color="secondary" 
                                variant="tonal" 
                                :to="{ name: 'blogs' }" 
                                :disabled="isSubmitting"
                            >
                                <VIcon start icon="tabler-x" />
                                Cancel
                            </VBtn>
                        </VCol>
                    </VRow>
                </VForm>
            </VCardText>
        </VCard>
    </div>
</template>

<style lang="scss" scoped></style>
