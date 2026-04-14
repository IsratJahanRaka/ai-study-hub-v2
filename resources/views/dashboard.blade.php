<div x-data="studyApp()" class="p-6 max-w-5xl mx-auto">
    <div class="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-lg border border-slate-200">
        <input type="file" @change="uploadFile" class="mb-4">
        <div x-show="loading" class="animate-pulse text-indigo-600">এআই টিচার আপনার ফাইলটি পড়ছে...</div>
    </div>

    <template x-if="data">
        <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-indigo-50 p-6 rounded-2xl">
                <h3 class="font-bold mb-2">সামারি</h3>
                <p x-text="data.summary" class="text-sm"></p>
            </div>
            <div class="bg-green-50 p-6 rounded-2xl">
                <h3 class="font-bold mb-2">গুরুত্বপূর্ণ টপিক</h3>
                <ul class="list-disc ml-5">
                    <template x-for="topic in data.topics">
                        <li x-text="topic"></li>
                    </template>
                </ul>
            </div>
        </div>
    </template>

    <div class="fixed bottom-5 right-5 w-80 bg-white shadow-2xl rounded-2xl overflow-hidden border">
        <div class="bg-indigo-600 p-4 text-white font-bold">এআই টিচার</div>
        <div class="h-64 p-4 overflow-y-auto" id="chatbox">
            <template x-for="msg in messages">
                <div :class="msg.role === 'user' ? 'text-right' : 'text-left'" class="mb-2">
                    <span :class="msg.role === 'user' ? 'bg-indigo-100' : 'bg-slate-100'" 
                          class="inline-block p-2 rounded-lg text-xs" x-text="msg.text"></span>
                </div>
            </template>
        </div>
        <div class="p-2 border-t">
            <input type="text" x-model="userMsg" @keydown.enter="sendMessage" placeholder="কিছু জিজ্ঞেস করুন..." class="w-full p-2 text-sm outline-none">
        </div>
    </div>
</div>

<script>
function studyApp() {
    return {
        loading: false,
        data: null,
        userMsg: '',
        messages: [],
        context: '',
        async uploadFile(e) {
            this.loading = true;
            let formData = new FormData();
            formData.append('file', e.target.files[0]);
            
            let res = await fetch('/api/upload-material', { method: 'POST', body: formData });
            let json = await res.json();
            this.data = json.data;
            this.context = json.data.summary; // চ্যাটের জন্য সামারিকে কন্টেক্সট হিসেবে ব্যবহার
            this.loading = false;
        },
        async sendMessage() {
            this.messages.push({ role: 'user', text: this.userMsg });
            let msg = this.userMsg;
            this.userMsg = '';
            
            let res = await fetch('/api/chat-with-teacher', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, context: this.context })
            });
            let json = await res.json();
            this.messages.push({ role: 'teacher', text: json.reply });
        }
    }
}
</script>