<script setup lang="ts">
import TipTapEditor from '@/components/editor/TipTapEditor.vue'
import { getHTTPPostResponse } from '@/composables/useHTTPMethods'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const formData = ref({
    title: '',
    description: '',
    content: '',
    seo_meta_tags: 'vghsd, dcsdcsd, sdcsdc, sdcsdc',
    seo_description: ''
})

const isFormValid = ref(false)
const hasSubmitted = ref(false)

const validateContent = () => {
    const hasContent = formData.value.content && formData.value.content.trim() !== '' && formData.value.content !== '<p></p>'
    return hasContent
}
const isSubmitting = ref(false)

const handleSubmit = async () => {
    hasSubmitted.value = true

    // Validate all required fields
    if (!formData.value.title || !formData.value.description || !validateContent() ||
        !formData.value.seo_meta_tags?.length || !formData.value.seo_description) {
        return
    }

    isSubmitting.value = true

    const response = await getHTTPPostResponse("/blogs/", formData.value, true);
    console.log('response', response);

    if (response) {
        isSubmitting.value = false
        // Redirect to blog list after successful submission
        router.push('/blogs')
    }
}
</script>

<template>
    <div>
        <VCard>
            <VCardItem class="d-flex align-center justify-space-between">
                <VCardTitle>Add New Blog Post</VCardTitle>
                <!-- <VBtn color="secondary" variant="tonal" to="/blogs" prepend-icon="tabler-arrow-left">
                    Back to List
                </VBtn> -->
            </VCardItem>

            <VCardText>
                <VForm v-model="isFormValid" @submit.prevent="handleSubmit">
                    <VRow>
                        <VCol cols="12">
                            <VTextField v-model="formData.title" label="Title"
                                :rules="[v => !!v || 'Title is required']" required />
                        </VCol>

                        <VCol cols="12">
                            <VTextarea v-model="formData.description" label="Description" rows="3"
                                :rules="[v => !!v || 'Description is required']" required />
                        </VCol>

                        <VCol cols="12">
                            <VLabel class="mb-2">Content <span class="text-error">*</span></VLabel>
                            <TipTapEditor v-model="formData.content"
                                placeholder="Start writing your blog post here..." />
                            <div v-if="hasSubmitted && !validateContent()" class="text-error text-caption mt-1">
                                Content is required
                            </div>
                        </VCol>

                        <VCol cols="12" md="6">
                            <VCombobox label="SEO Meta Tags" clearable multiple chips
                                hint="Type and press enter to add multiple tags"
                                :rules="[v => (v && v.length > 0) || 'At least one SEO Meta Tag is required']"
                                required />
                        </VCol>

                        <VCol cols="12" md="6">
                            <VTextField v-model="formData.seo_description" label="SEO Meta Description"
                                :rules="[v => !!v || 'SEO Meta Description is required']" required />
                        </VCol>

                        <VCol cols="12" class="d-flex gap-4">
                            <VBtn type="submit" color="primary" :loading="isSubmitting"
                                :disabled="!isFormValid || isSubmitting">
                                <VIcon start icon="tabler-send" />
                                Publish Post
                            </VBtn>

                            <VBtn color="secondary" variant="tonal" :to="{ name: 'blogs' }" :disabled="isSubmitting">
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
