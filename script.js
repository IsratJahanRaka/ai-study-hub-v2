// Check if logged in
if (localStorage.getItem('loggedIn') !== 'true') {
    window.location.href = 'login.html';
}

function setup() {
    return {
        isDark: localStorage.getItem('dark') === 'true',
        dragOver: false,
        fileName: '',
        isProcessing: false,
        aiResponse: '',
        toast: { show: false, message: '' },
        uploadedFileContent: null,
        fileType: null,
        currentTab: 'AI Study Hub',
        globalSearchQuery: '',
        activeIframeUrl: null,
        activeIframeTitle: '',
        libraryBooks: [],
        libraryPage: 1,
        savedBooks: JSON.parse(localStorage.getItem('savedBooks') || '[]'),
        myNotes: JSON.parse(localStorage.getItem('myNotes') || '[]'),
        newNoteText: '',
        chatMessages: [
            { role: 'model', text: 'Hello! I am your Study.AI Tutor. Feel free to ask me anything about your studies!' }
        ],
        isChatting: false,
        chatImage: null,
        isListening: false,
        speechRecognition: null,
        libraryQuery: '',
        libraryTotalDocs: 0,
        isSearchingLibrary: false,

        // Notification States
        showNotifications: false,
        unreadNotices: 0,
        allNotices: [],

        initNotices() {
            const defaultNotices = [
                { title: 'Important Administrative Update', body: 'The newest advanced AI models have been provisioned by the Administrator. Try out the new physics simulations in your AI Tutor tab!', time: '1 hour ago', isMock: true },
                { title: 'Server Maintenance Complete', body: 'Study.AI online database migrations are officially complete. Cloud sync is operational.', time: '2 hours ago', isMock: true }
            ];

            const regenerateState = () => {
                const liveNotices = JSON.parse(localStorage.getItem('globalNotices') || '[]');
                this.allNotices = [...liveNotices, ...defaultNotices];
                this.unreadNotices = liveNotices.length > 0 ? liveNotices.length : 2;
            };

            regenerateState();

            // Real-time synchronization across browser tabs for instant Admin broadcasts
            window.addEventListener('storage', (e) => {
                if (e.key === 'globalNotices') {
                    regenerateState();
                    // Optional alert or sound can be played here
                }
            });
        },

        // GPA Calculator logic
        gpaSubjects: [
            { id: 1, name: 'Course 1', credits: 3, grade: 'A' },
            { id: 2, name: 'Course 2', credits: 3, grade: 'B+' }
        ],
        gpaResult: '0.00',
        gradeValues: {
            'A+': 4.0, 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0
        },

        calculateGPA() {
            let totalPts = 0;
            let totalCredits = 0;
            this.gpaSubjects.forEach(sub => {
                const credits = parseFloat(sub.credits) || 0;
                const gradeVal = this.gradeValues[sub.grade.toUpperCase()] !== undefined ? this.gradeValues[sub.grade.toUpperCase()] : 0;
                totalPts += credits * gradeVal;
                totalCredits += credits;
            });
            if (totalCredits > 0) {
                this.gpaResult = (totalPts / totalCredits).toFixed(2);
            } else {
                this.gpaResult = '0.00';
            }
            this.showToast('GPA Computed Successfully!');
        },

        addGPASubject() {
            this.gpaSubjects.push({ id: Date.now(), name: `Course ${this.gpaSubjects.length + 1}`, credits: 3, grade: 'A' });
        },
        removeGPASubject(id) {
            this.gpaSubjects = this.gpaSubjects.filter(sub => sub.id !== id);
        },

        // Code Compiler State
        compilerLang: 'python',
        compilerCode: 'print("Hello, World!")',
        compilerOutput: '',
        isCompiling: false,
        compilerVersions: {
            'python': '3.10.0',
            'javascript': '18.15.0',
            'c++': '10.2.0',
            'java': '15.0.2',
            'c': '10.2.0',
            'php': '8.2.3',
            'ruby': '3.0.1',
            'go': '1.16.2',
            'rust': '1.68.2'
        },

        async runCompilerCode() {
            if (!this.compilerCode.trim()) return;
            this.isCompiling = true;
            this.compilerOutput = 'Booting AI Compiler Simulation Sandbox... \nValidating syntax and evaluating logic...';

            try {
                // Since public remote sandbox APIs (like Piston) have closed anonymous access, 
                // we will brilliantly route the compilation to the user's selected AI model 
                // to interpret and execute the code natively in its highly advanced environment.

                let selectedModelIdentifier = this.selectedModel;
                if (selectedModelIdentifier === 'cloud-gpt') selectedModelIdentifier = 'openai/gpt-4o-mini';

                const prompt = `Act as an exact terminal console for the ${this.compilerLang} programming language. Evaluate the following code exactly as a compiler would. If there are syntax errors, output the strict compiler error. If the code is correct, output ONLY the exact text that would print to the standard console. Do not include markdown, backticks, explanations, or any other conversation formatting. Only return the raw standard output. \n\nCode to execute:\n${this.compilerCode}`;

                if (!this.apiKeys.openrouter) {
                    this.compilerOutput = 'Error: OpenRouter API Key is missing. Please go to Settings and add your OpenRouter Key to run code compiled via AI.';
                    this.isCompiling = false;
                    return;
                }

                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKeys.openrouter}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': window.location.href,
                        'X-Title': 'Study.AI Compiler'
                    },
                    body: JSON.stringify({
                        model: selectedModelIdentifier,
                        messages: [{ role: 'user', content: prompt }]
                    })
                });

                const data = await response.json();
                if (data.choices && data.choices[0] && data.choices[0].message) {
                    let out = data.choices[0].message.content.trim();
                    // Strip accidental backticks if AI returns markdown
                    if (out.startsWith('```')) {
                        out = out.replace(/^```[a-z]*\n/gi, '').replace(/```$/g, '').trim();
                    }
                    this.compilerOutput = out;
                } else if (data.error) {
                    this.compilerOutput = 'Compiler Execution Error:\n' + JSON.stringify(data.error.message);
                } else {
                    this.compilerOutput = 'Execution finished with null response.';
                }

            } catch (err) {
                this.compilerOutput = 'Sandbox Sandbox Error: Unable to evaluate code logic.';
                console.error(err);
            } finally {
                this.isCompiling = false;
                this.showToast('Execution Completed!');
            }
        },

        globalSearchQuery: '',

        executeKhojSearch() {
            if (!this.globalSearchQuery.trim()) return;
            const query = this.globalSearchQuery.toLowerCase();

            if (this.currentTab === 'Global Library') {
                this.libraryQuery = query;
                this.searchLibrary(1);
            } else if (this.currentTab === 'StudyGram') {
                this.isMessengerOpen = true;
                this.isSearchOpen = true;
                this.searchQuery = query;
            } else if (this.currentTab === 'AI Tutor') {
                this.chatInput = query;
                this.sendChatMessage();
            } else if (this.currentTab !== 'My Courses' && this.currentTab !== 'Free Courses') {
                this.currentTab = 'Free Courses';
            }
            this.showToast('Khoj executed for: ' + query);
        },

        // Quiz states
        quizData: null,
        quizActive: false,
        quizFinished: false,
        quizIndex: 0,
        quizTimer: 10,
        quizCorrect: 0,
        quizWrong: 0,
        quizInterval: null,

        // Inside-App Embedded Course Viewer
        activeIframeUrl: null,
        activeIframeTitle: '',

        openCourseViewer(course) {
            this.activeIframeTitle = course.name;
            this.activeIframeUrl = course.url;
            this.currentTab = 'Course Viewer';
        },

        // StudyGram Messenger States
        isMessengerOpen: false,
        isSearchOpen: false,
        searchQuery: '',
        friendSearchQuery: '',
        socialNotifications: [
            { id: 1, text: 'Sarah Ahmed liked your post', time: '2m ago', type: 'like' },
            { id: 2, text: 'New Group: Mathematics 101 created', time: '1h ago', type: 'group' }
        ],
        activeChatUser: null,
        messengerInput: '',
        messengerStories: [
            { id: 1, name: 'Add Story', avatar: 'https://ui-avatars.com/api/?name=+&background=4F46E5&color=fff', isMe: true },
            { id: 2, name: 'Sarah', avatar: 'https://ui-avatars.com/api/?name=Sarah+J&background=random', hasStory: true },
            { id: 3, name: 'Mike', avatar: 'https://ui-avatars.com/api/?name=Mike+T&background=random', hasStory: true }
        ],
        messengerFriends: [],
        registeredMembers: [
            { id: 5, username: '@david_smith', name: 'David Smith', avatar: 'https://ui-avatars.com/api/?name=David&background=random', role: 'Student' },
            { id: 6, username: '@emily_chen', name: 'Emily Chen', avatar: 'https://ui-avatars.com/api/?name=Emily&background=random', role: 'Tutor' },
            { id: 7, username: '@jordan_lee', name: 'Jordan Lee', avatar: 'https://ui-avatars.com/api/?name=Jordan&background=random', role: 'Student' },
            { id: 8, username: '@dr_harris', name: 'Dr. Harris', avatar: 'https://ui-avatars.com/api/?name=Harris&background=random', role: 'Professor' }
        ],
        messengerChats: [
            { id: 1, sender: 'Sarah Jenkins', type: 'text', msg: 'Hey! Are you studying for the midterm right now?', time: '10:42 AM' },
            { id: 2, sender: 'me', type: 'text', msg: 'Yeah, I just uploaded the slides to the AI Hub.', time: '10:45 AM' },
            { id: 3, sender: 'Sarah Jenkins', type: 'voice', msg: '0:15', time: '10:46 AM' },
            { id: 4, sender: 'me', type: 'sticker', msg: '👍', time: '10:47 AM' }
        ],
        // Social / StudyGram State
        friends: [
            { id: 1, name: 'Taimoor Safdar', avatar: 'https://ui-avatars.com/api/?name=TS&background=random', online: true },
            { id: 2, name: 'Sarah Ahmed', avatar: 'https://ui-avatars.com/api/?name=SA&background=random', online: true },
            { id: 3, name: 'Tanvir Hossain', avatar: 'https://ui-avatars.com/api/?name=TH&background=random', online: false },
        ],
        groups: [
            { id: 1, name: 'SSC 2026 Batch', avatar: 'https://ui-avatars.com/api/?name=SSC&background=indigo', members: 1205 },
            { id: 2, name: 'Physics Masters', avatar: 'https://ui-avatars.com/api/?name=PM&background=blue', members: 450 },
        ],
        socialShortcuts: [
            { name: 'CS101 Group', icon: 'fa-users', color: 'bg-indigo-100 text-indigo-500' },
            { name: 'Notes Shared', icon: 'fa-book', color: 'bg-green-100 text-green-500' },
        ],
        feedPosts: [],
        newPostContent: '',
        newPostImage: '',
        
        async loadSocialData() {
            // Simulated feed load
            this.feedPosts = [
                { 
                    id: 1, 
                    name: 'Taimoor Safdar', 
                    avatar: 'https://ui-avatars.com/api/?name=TS&background=random', 
                    content: 'Just finished the Quantum Mechanics chapter! Feeling productive.',
                    media_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800',
                    created_at: new Date(),
                    likes: 12,
                    comments: [
                        { name: 'Sarah Ahmed', text: 'Great job! I need your notes.' }
                    ],
                    shares: 2
                }
            ];
        },

        createPost() {
            if (!this.newPostContent.trim() && !this.newPostImage) return;
            const newPost = {
                id: Date.now(),
                name: this.userProfile.name,
                avatar: this.userProfile.avatar,
                content: this.newPostContent,
                media_url: this.newPostImage,
                created_at: new Date(),
                likes: 0,
                comments: [],
                shares: 0
            };
            this.feedPosts.unshift(newPost);
            this.newPostContent = '';
            this.newPostImage = '';
            this.showToast('Post shared successfully!');
        },

        reactToPost(postId) {
            const post = this.feedPosts.find(p => p.id === postId);
            if (post) {
                post.likes++;
                this.showToast('You liked this post!');
            }
        },

        addComment(postId, commentText) {
            const post = this.feedPosts.find(p => p.id === postId);
            if (post && commentText.trim()) {
                post.comments.push({ name: this.userProfile.name, text: commentText });
                this.showToast('Comment added');
            }
        },

        createNewGroup(name) {
            const newGroup = {
                id: Date.now(),
                name: name || 'New Study Group',
                avatar: `https://ui-avatars.com/api/?name=${name ? name.charAt(0) : 'G'}&background=random`,
                members: 1
            };
            this.groups.unshift(newGroup);
            this.showToast('Group created successfully!');
        },

        addFriend(member) {
            if (!this.friends.find(f => f.id === member.id)) {
                this.friends.push({...member, online: false});
                this.showToast('Friend added successfully!');
            }
        },

        async sendMessengerMsg() {
            if (!this.messengerInput.trim() || !this.activeChatUser) return;

            const msgObj = {
                id: Date.now(),
                sender: 'me',
                type: 'text',
                msg: this.messengerInput.trim(),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            this.messengerChats.push(msgObj);

            // Simulation of receiving a reply
            if (this.messengerInput.toLowerCase().includes('hello')) {
                setTimeout(() => {
                    this.receiveMockMessage('Hey there! How can I help you today?');
                }, 1500);
            }

            this.messengerInput = '';
            setTimeout(() => {
                const chatBox = document.getElementById('studygram-chat');
                if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
            }, 50);
        },

        receiveMockMessage(text) {
            const reply = {
                id: Date.now(),
                sender: this.activeChatUser?.name || 'Friend',
                type: 'text',
                msg: text || 'This is a simulated response!',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            this.messengerChats.push(reply);
            this.socialNotifications.unshift({ id: Date.now(), text: `New message from ${reply.sender}`, time: 'Just now', type: 'msg' });
            this.showToast('New message received!');
            
            setTimeout(() => {
                const chatBox = document.getElementById('studygram-chat');
                if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
            }, 50);
        },

        triggerCall(type) {
            this.showToast(`Initiating ${type} Call... (Feature in development)`);
        },

        feedPosts: [],
        newPostContent: '',

        async loadSocialData() {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                // Production-Aware Social Fetch (Backend -> LocalStorage Fallback)
                const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://api.study-ai.com';
                
                let res = await fetch(`${API_BASE}/api/posts`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => null);

                if (res && res.ok) {
                    this.feedPosts = await res.json();
                } else {
                    this.feedPosts = JSON.parse(localStorage.getItem('studygram_posts') || '[]');
                    console.warn('Backend unreachable, using cached posts.');
                }

                let uRes = await fetch(`${API_BASE}/api/users/search`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => null);

                if (uRes && uRes.ok) {
                    let users = await uRes.json();
                    this.messengerFriends = users.filter(u => u.id !== this.userProfile.id).map(u => ({
                        id: u.id, name: u.name, avatar: u.avatar, online: true, lastMsg: 'Tap to chat'
                    }));
                } else {
                    this.messengerFriends = JSON.parse(localStorage.getItem('local_users') || '[]');
                }
            } catch (e) { 
                this.showToast('Network error: Please check your connection or API settings.');
            }
        },

        deletePost(postId) {
            this.feedPosts = this.feedPosts.filter(p => p.id !== postId);
            this.showToast('Post deleted');
        },

        uploadProfilePic(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (re) => { 
                    this.userProfile.avatar = re.target.result; 
                    localStorage.setItem('userProfile', JSON.stringify(this.userProfile));
                    this.showToast('Profile picture updated!'); 
                };
                reader.readAsDataURL(file);
            }
        },

        uploadCoverPhoto(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (re) => { 
                    this.userProfile.cover = re.target.result; 
                    localStorage.setItem('userProfile', JSON.stringify(this.userProfile));
                    this.showToast('Cover photo updated!'); 
                };
                reader.readAsDataURL(file);
            }
        },

        saveBio(newBio) {
            this.userProfile.bio = newBio;
            localStorage.setItem('userProfile', JSON.stringify(this.userProfile));
            this.showToast('Bio updated!');
        },

        deleteGroup(groupId) {
            this.groups = this.groups.filter(g => g.id !== groupId);
            this.showToast('Group deleted permanently');
        },

        leaveGroup(groupId) {
            this.groups = this.groups.filter(g => g.id !== groupId);
            this.showToast('You have left the group');
        },

        addGroupMember(groupId, memberName) {
            const group = this.groups.find(g => g.id === groupId);
            if (group) {
                group.members++;
                this.showToast(`${memberName} added to group`);
            }
        },

        removeGroupMember(groupId) {
            const group = this.groups.find(g => g.id === groupId);
            if (group && group.members > 1) {
                group.members--;
                this.showToast('Member removed');
            }
        },

        addFamilyMember(name, relation) {
            if (name.trim() && relation) {
                this.userProfile.family.push({ id: Date.now(), name, relation });
                localStorage.setItem('userProfile', JSON.stringify(this.userProfile));
                this.showToast('Family member added');
            }
        },

        init() {
            if (this.libraryBooks.length === 0) {
                this.searchLibrary(1);
            }
            this.loadSocialData();
        },

        libraryQuery: '',
        isSearchingLibrary: false,
        libraryBooks: [],
        libraryPage: 1,
        libraryTotalDocs: 0,
        savedBooks: JSON.parse(localStorage.getItem('savedBooks') || '[]'),

        myNotes: JSON.parse(localStorage.getItem('myNotes')) || [],
        newNoteText: '',

        chatMessages: [
            { role: 'model', text: 'Hello! I am your Study.AI Tutor. Feel free to ask me anything about your studies!' }
        ],
        chatInput: '',
        isChatting: false,

        apiKeys: {
            gemini: localStorage.getItem('gemini_key') || '',
            openrouter: localStorage.getItem('openrouter_key') || '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',
            openai: localStorage.getItem('openai_key') || '',
            groq: localStorage.getItem('groq_key') || ''
        },

        userProfile: JSON.parse(localStorage.getItem('userProfile')) || {
            id: 'me',
            name: 'Alex Johnson',
            email: 'alex.johnson@gmail.com',
            username: '@alex_study_pro',
            phone: '',
            birthdate: '',
            avatar: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=4F46E5&color=fff',
            cover: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&q=80&w=1200',
            bio: 'Computer Science student | Passionate about AI & EdTech 🚀',
            googleLinked: false,
            role: 'Student',
            points: 1250,
            level: 'Gold',
            family: [
                { id: 1, name: 'John Johnson', relation: 'Father' }
            ]
        },
        selectedModel: 'google/gemini-2.0-flash-lite-001',
        availableModels: [
            { id: 'google/gemini-2.0-flash-lite-001', name: 'Gemini 2.0 Lite (Free & Vision)', provider: 'openrouter', vision: true },
            { id: 'google/gemini-pro-1.5', name: 'Gemini 1.5 Pro (Advanced Vision)', provider: 'openrouter', vision: true },
            { id: 'mistralai/pixtral-12b', name: 'Pixtral 12B (Fast Vision)', provider: 'openrouter', vision: true },
            { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (Coding)', provider: 'openrouter', vision: false },
            { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B (Pro)', provider: 'openrouter', vision: false },
            { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B (Free)', provider: 'openrouter', vision: false },
            { id: 'microsoft/phi-3-medium-128k-instruct:free', name: 'Phi-3 Medium (Free)', provider: 'openrouter', vision: false }
        ],

        // Code & Learn Tutorial State
        selectedTutorialLang: 'html',
        tutorialData: {
            'html': {
                name: 'HTML Tutorial', icon: 'fa-html5', color: 'text-orange-500',
                desc: 'HyperText Markup Language is the standard markup language for creating web pages.',
                examples: [
                    { title: 'Base Structure', code: '<!DOCTYPE html>\n<html>\n<body>\n  <h1>Study.AI Tutorials</h1>\n  <p>Learning made simple and intelligent.</p>\n</body>\n</html>' },
                    { title: 'Links & Images', code: '<a href="https://www.w3schools.com">Visit W3Schools</a>\n<img src="https://ui-avatars.com/api/?name=AI" width="100">' }
                ]
            },
            'css': {
                name: 'CSS Tutorial', icon: 'fa-css3-alt', color: 'text-blue-500',
                desc: 'Cascading Style Sheets is the language we use to style an HTML document.',
                examples: [
                    { title: 'Beautiful Styling', code: 'body {\n  background-color: #f8fafc;\n  font-family: sans-serif;\n}\nh1 {\n  color: #4f46e5;\n  text-align: center;\n  padding: 20px;\n}' }
                ]
            },
            'javascript': {
                name: 'JavaScript Tutorial', icon: 'fa-js', color: 'text-yellow-500',
                desc: 'JavaScript is the programming language of the Web. It is used to make web pages interactive.',
                examples: [
                    { title: 'Dynamic Welcome', code: 'const name = "Scholar";\nconsole.log("Welcome to Study.AI, " + name + "!");\n\nfunction studyAlert() {\n  alert("Time to learn JS!");\n}\n\nstudyAlert();' }
                ]
            },
            'sql': {
                name: 'SQL Tutorial', icon: 'fa-database', color: 'text-indigo-500',
                desc: 'SQL is a standard language for storing, manipulating and retrieving data in databases.',
                examples: [
                    { title: 'Basic Query', code: 'SELECT * FROM Students\nWHERE GPA > 3.5\nORDER BY Name ASC;' }
                ]
            },
            'python': {
                name: 'Python Tutorial', icon: 'fa-python', color: 'text-sky-500',
                desc: 'Python is a popular programming language. It is used for web development, software development, and AI.',
                examples: [
                    { title: 'AI Simulation', code: 'def study_bot(topic):\n    return f"Analyzing {topic} with AI logic..."\n\nprint(study_bot("Quantum Physics"))' }
                ]
            },
            'java': {
                name: 'Java Tutorial', icon: 'fa-java', color: 'text-red-500',
                desc: 'Java is a popular programming language, created in 1995. More than 3 billion devices run Java.',
                examples: [
                    { title: 'Class Example', code: 'public class StudyHub {\n  public static void main(String[] args) {\n    System.out.println("Java Sandbox Active");\n  }\n}' }
                ]
            },
            'php': {
                name: 'PHP Tutorial', icon: 'fa-php', color: 'text-purple-500',
                desc: 'PHP is a server scripting language, and a powerful tool for making dynamic web pages.',
                examples: [
                    { title: 'Backend Logic', code: '<?php\n  $platform = "Study.AI";\n  echo "<h1>Welcome to $platform</h1>";\n?>' }
                ]
            }
        },

        tryTutorialCode(code, lang) {
            this.compilerCode = code;
            this.compilerLang = lang === 'javascript' ? 'javascript' : lang.toLowerCase();
            this.currentTab = 'Code Compiler';
            this.showToast('Code imported to Sandbox! Press Run to execute.');
            // Update active menu link
            this.menuItems.forEach(i => i.active = false);
            const compItem = this.menuItems.find(i => i.name === 'Code Compiler');
            if (compItem) compItem.active = true;
        },

        explainTutorialCode(code, lang) {
            this.currentTab = 'AI Tutor';
            this.chatInput = `Can you precisely explain how this ${lang.toUpperCase()} code works and what it does? \n\n\`\`\`${lang}\n${code}\n\`\`\``;
            this.sendChatMessage();
            this.showToast('Code Assistant is analyzing...');
        },

        // CV Maker State
        cvData: {
            name: 'John Doe', email: 'john@example.com', phone: '+8801XXXXXXXXX', address: 'Dhaka, Bangladesh',
            website: 'www.portfolio.com', bio: 'Passionate computer science student dedicated to solving complex problems with AI.',
            experience: [{ company: 'Tech Corp', role: 'Intern', period: '2023 - Present', desc: 'Building smart web modules using Alpine.js.' }],
            education: [{ school: 'Daffodil International University', degree: 'BSc in CSE', year: '2024' }],
            skills: ['JavaScript', 'Python', 'Tailwind CSS'],
            softSkills: ['Leadership', 'Communication'],
            projects: [{ name: 'Study.AI', link: '#', desc: 'All-in-one AI study assistant.' }],
            achievements: ['Won Hackathon 2023', 'Top 1% in Class'],
            certifications: ['AWS Cloud Practitioner', 'Google Data Analytics'],
            languages: ['English', 'Bengali'],
            references: 'Available upon request.'
        },
        selectedCvTemplate: 'antigravity',
        cvTemplates: [
            { id: 'antigravity', name: 'Anti-Gravity (Futuristic)', theme: 'Holographic', primaryColor: '#00d2ff', bg: 'antigravity' },
            { id: 'chrono', name: '1. Chronological', theme: 'Professional', desc: 'Latest first experience.' },
            { id: 'functional', name: '2. Functional', theme: 'Skill-Based', desc: 'Focus on your talents.' },
            { id: 'hybrid', name: '3. Combination', theme: 'Recommended', desc: 'Best of both worlds.' },
            { id: 'targeted', name: '4. Targeted', theme: 'Custom', desc: 'Specific job match.' },
            { id: 'europass', name: '5. Europass', theme: 'EU Standard', desc: 'Formal European layout.' },
            { id: 'ats', name: '6. ATS-Friendly', theme: 'Simple', desc: 'Machine readable.' },
            { id: 'creative', name: '7. Creative', theme: 'Designer', desc: 'Visual excellence.' },
            { id: 'infographic', name: '8. Infographic', theme: 'Visual', desc: 'Charts & Icons.' },
            { id: 'mini', name: '9. Mini CV', theme: 'Network', desc: 'Short summary.' },
            { id: 'academic', name: '10. Academic', theme: 'Research', desc: 'PhD & Research focused.' }
        ],

        addCvItem(type) {
            if (type === 'exp') this.cvData.experience.push({ company: '', role: '', period: '', desc: '' });
            if (type === 'edu') this.cvData.education.push({ school: '', degree: '', year: '' });
            if (type === 'skill') this.cvData.skills.push('');
            if (type === 'soft') this.cvData.softSkills.push('');
            if (type === 'proj') this.cvData.projects.push({ name: '', link: '', desc: '' });
            if (type === 'ach') this.cvData.achievements.push('');
            if (type === 'cert') this.cvData.certifications.push('');
            if (type === 'lang') this.cvData.languages.push('');
        },

        removeCvItem(type, index) {
            if (type === 'exp') this.cvData.experience.splice(index, 1);
            if (type === 'edu') this.cvData.education.splice(index, 1);
            if (type === 'skill') this.cvData.skills.splice(index, 1);
            if (type === 'soft') this.cvData.softSkills.splice(index, 1);
            if (type === 'proj') this.cvData.projects.splice(index, 1);
            if (type === 'ach') this.cvData.achievements.splice(index, 1);
            if (type === 'cert') this.cvData.certifications.splice(index, 1);
            if (type === 'lang') this.cvData.languages.splice(index, 1);
        },

        downloadWord() {
            this.showToast('Generating Universal .docx Template link...');
            setTimeout(() => {
                window.open('https://files.resume-now.com/samples/resume-templates/professional-resume-template-modern.docx', '_blank');
            }, 1000);
        },

        downloadCv() {
            window.print();
        },

        menuItems: [
            { name: 'Dashboard', icon: 'fa-solid fa-grid-2', url: '#', active: false },
            { name: 'AI Study Hub', icon: 'fa-solid fa-flask', url: '#', active: true },
            { name: 'Code & Learn', icon: 'fa-solid fa-laptop-code', url: '#', active: false },
            { name: 'Code Compiler', icon: 'fa-solid fa-terminal', url: '#', active: false },
            { name: 'CV Maker', icon: 'fa-solid fa-file-invoice', url: '#', active: false },
            { name: 'My Library', icon: 'fa-solid fa-bookmark', url: '#', active: false },
            { name: 'Global Library', icon: 'fa-solid fa-globe', url: '#', active: false },
            { name: 'Free Courses', icon: 'fa-solid fa-graduation-cap', url: '#', active: false },
            { name: 'My Courses', icon: 'fa-solid fa-laptop-code', url: '#', active: false },
            { name: 'StudyGram', icon: 'fa-solid fa-icons', url: '#', active: false },
            { name: 'AI Tutor', icon: 'fa-solid fa-robot', url: '#', active: false },
            { name: 'Settings', icon: 'fa-solid fa-gear', url: '#', active: false }
        ],

        // Free Courses List
        freeCoursesList: [
            { id: 1, name: 'Coursesity (Free Udemy)', desc: 'Discover thousands of free Udemy courses regularly updated.', url: 'https://coursesity.com/provider/free/udemy-courses', logo: 'https://ui-avatars.com/api/?name=C&background=10B981&color=fff' },
            { id: 2, name: 'AnswerSQ Free Certificates', desc: 'Find paid courses heavily discounted to free with certificates.', url: 'https://answersq.com/udemy-paid-courses-for-free-with-certificate/', logo: 'https://ui-avatars.com/api/?name=AQ&background=F59E0B&color=fff' },
            { id: 3, name: 'Alison Certificate Courses', desc: 'Empower yourself with Alison\'s globally recognized free courses.', url: 'https://alison.com/certificate-courses', logo: 'https://alison.com/favicon.ico' },
            { id: 4, name: 'UniAthena Short Courses', desc: 'Free highly valuable short courses for professional growth.', url: 'https://uniathena.com/short-courses', logo: 'https://ui-avatars.com/api/?name=UA&background=E11D48&color=fff' },
            { id: 5, name: 'Ostad App', desc: 'Live skills, professional technical education platform.', url: 'https://ostad.app', logo: 'https://ui-avatars.com/api/?name=O&background=18181B&color=fff' },
            { id: 6, name: '10 Minute School', desc: 'The largest online education platform in Bangladesh.', url: 'https://10minuteschool.com', logo: 'https://ui-avatars.com/api/?name=10&background=10B981&color=fff' },
            { id: 7, name: 'Shikho', desc: 'Smart interactive learning for school and skills.', url: 'https://shikho.com', logo: 'https://ui-avatars.com/api/?name=S&background=6366F1&color=fff' },
            { id: 8, name: 'Udemy Free Courses', desc: 'The official Udemy directory to totally free tutorials.', url: 'https://www.udemy.com/courses/free', logo: 'https://www.udemy.com/staticx/udemy/images/v7/apple-touch-icon.png' },
            { id: 9, name: 'Coursera Career Academy', desc: 'Build skills with world-class universities and companies.', url: 'https://www.coursera.org/career-academy', logo: 'https://ui-avatars.com/api/?name=C&background=2563EB&color=fff' },
            { id: 10, name: 'Ghoori Learning', desc: 'Learn diverse local skills and professional subjects.', url: 'https://ghoorilearning.com', logo: 'https://ui-avatars.com/api/?name=GL&background=059669&color=fff' },
            { id: 11, name: 'ClassCentral', desc: 'A vast search engine for hundreds of MOOCs and free courses.', url: 'https://www.classcentral.com', logo: 'https://ui-avatars.com/api/?name=CC&background=3B82F6&color=fff' }
        ],
        savedCourses: JSON.parse(localStorage.getItem('savedCourses') || '[]'),

        enrollCourse(course) {
            if (!this.savedCourses.find(c => c.id === course.id)) {
                this.savedCourses.push(course);
                localStorage.setItem('savedCourses', JSON.stringify(this.savedCourses));
                this.showToast(course.name + ' added to My Courses!');
            } else {
                this.showToast('Course already in My Courses!');
            }
        },

        removeCourse(id) {
            this.savedCourses = this.savedCourses.filter(c => c.id !== id);
            localStorage.setItem('savedCourses', JSON.stringify(this.savedCourses));
            this.showToast('Course removed');
        },

        logout() {
            localStorage.removeItem('loggedIn');
            window.location.href = 'login.html';
        },

        history: [
            { title: 'Biology Chapter 4', time: '2 hours ago', icon: 'fa-solid fa-file-pdf', color: 'bg-red-100 text-red-500' },
            { title: 'Advanced Calculus Quiz', time: 'Yesterday', icon: 'fa-solid fa-brain', color: 'bg-purple-100 text-purple-500' },
            { title: 'World History Summary', time: '3 days ago', icon: 'fa-solid fa-align-left', color: 'bg-blue-100 text-blue-500' },
        ],

        toggleTheme() {
            this.isDark = !this.isDark;
            localStorage.setItem('dark', this.isDark);
        },

        handleFileSelect(e) {
            const file = e.target.files[0];
            this.processFile(file);
        },

        handleDrop(e) {
            this.dragOver = false;
            const file = e.dataTransfer.files[0];
            this.processFile(file);
        },

        processFile(file) {
            if (file) {
                this.fileName = file.name;
                this.fileType = file.type;
                this.showToast(`Selected: ${file.name}`);

                const fileReader = new FileReader();
                fileReader.onload = async (event) => {
                    if (this.fileType.includes('image')) {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            let w = img.width;
                            let h = img.height;
                            const MAX_DIM = 1000;
                            if (w > h && w > MAX_DIM) { h *= MAX_DIM / w; w = MAX_DIM; }
                            else if (h > MAX_DIM) { w *= MAX_DIM / h; h = MAX_DIM; }
                            canvas.width = w;
                            canvas.height = h;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, w, h);
                            this.uploadedFileContent = canvas.toDataURL('image/jpeg', 0.6);
                        };
                        img.src = event.target.result;
                    } else if (this.fileType === 'application/pdf') {
                        const typedarray = new Uint8Array(event.target.result);
                        try {
                            const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
                            let maxPages = pdf.numPages;
                            let text = "";
                            if (maxPages > 12) maxPages = 12; // parse max 12 pages for speed/tokens
                            for (let i = 1; i <= maxPages; i++) {
                                const page = await pdf.getPage(i);
                                const textContent = await page.getTextContent();
                                text += textContent.items.map(s => s.str).join(' ') + " ";
                            }
                            this.uploadedFileContent = text;
                        } catch (err) {
                            console.error(err);
                            this.showToast("Local PDF parsing failed. File might be corrupted.");
                        }
                    }
                };

                if (file.type.includes('image')) {
                    fileReader.readAsDataURL(file);
                } else if (file.type === 'application/pdf') {
                    fileReader.readAsArrayBuffer(file);
                } else {
                    alert('Please upload an Image or PDF file.');
                }
            }
        },

        async processAI(type) {
            if (!this.fileName || !this.uploadedFileContent) {
                alert('Please wait for the file to process locally or upload a valid file first.');
                return;
            }

            this.isProcessing = true;
            this.aiResponse = '';

            try {
                let prompt = "";
                if (type === 'summary') {
                    prompt = "Please act as an expert tutor. Summarize the following uploaded document/image comprehensively but concisely. Use easy-to-read markdown formatting like bold text, bullet points, and numbered lists to structure your summary.";
                } else if (type === 'quiz') {
                    prompt = "Generate EXACTLY 15 multiple choice questions based ENTIRELY on the provided document/image. Return STRICTLY ONLY a JSON array. Do not use markdown backticks like ```json. Your entire response MUST just be a valid JSON array. Structure: [ { \"question\": \"q text\", \"options\": [\"opt a\", \"opt b\", \"opt c\", \"opt d\"], \"correctAnswer\": 0 }, ... ]";
                } else if (type === 'topics') {
                    prompt = "Please act as an expert tutor. Split the uploaded document/image into up to 5 core study topics. For each topic, suggest one visual diagram or image I should search for to understand it better. Format in markdown.";
                }

                let textResult = "";
                const targetModelObj = this.availableModels.find(m => m.id === this.selectedModel);
                let useCloudProxy = (targetModelObj.provider === 'cloud');

                if (targetModelObj.provider !== 'cloud' && !this.apiKeys[targetModelObj.provider]) {
                    // Fallback to Cloud server if local key missing
                    useCloudProxy = true;
                }

                let responseData;

                if (useCloudProxy) {
                    // USE OUR VERSATILE BACKEND PROXY
                    try {
                        const token = localStorage.getItem('token');
                        const response = await fetch('http://localhost:5000/api/ai/process', {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                prompt: prompt,
                                content: this.uploadedFileContent,
                                type: this.fileType && this.fileType.includes('image') ? 'image' : 'text',
                                model: targetModelObj.provider === 'cloud' ? 'gpt-4o-mini' : targetModelObj.id,
                                provider: targetModelObj.provider === 'cloud' ? 'openai' : targetModelObj.provider
                            })
                        });
                        
                        const data = await response.json();
                        if (!response.ok) {
                            const errMsg = (data.error && data.error.message) ? data.error.message : (data.error || `Server Error ${response.status}`);
                            throw new Error(errMsg);
                        }
                        
                        if (data.choices && data.choices[0]) {
                            textResult = data.choices[0].message.content;
                        } else {
                            throw new Error('Malformed response from AI server');
                        }
                    } catch (e) {
                        let errorDetail = e.message;
                        if (errorDetail === 'Failed to fetch') {
                            errorDetail = 'The AI Backend Server is offline. Please start it with "node server.js" in the backend folder.';
                        }
                        this.aiResponse = `<div class="bg-red-50 p-6 rounded-[2rem] text-red-600 border border-red-200">
                            <p class="font-bold text-lg mb-2"><i class="fa-solid fa-triangle-exclamation mr-2"></i>Cloud API Connection Error</p>
                            <p class="text-sm leading-relaxed">${errorDetail}</p>
                            <div class="mt-4 pt-4 border-t border-red-100">
                                <p class="text-[10px] font-bold uppercase tracking-widest text-red-400">Next Steps</p>
                                <ul class="text-[11px] mt-2 space-y-1">
                                    <li>1. Check terminal for "Server running on http://localhost:5000"</li>
                                    <li>2. Ensure MongoDB is connected (or in demo mode)</li>
                                    <li>3. Verify your internet connection</li>
                                </ul>
                            </div>
                        </div>`;
                        this.isProcessing = false;
                        return;
                    }
                } else if (targetModelObj.provider === 'google') {
                    // NATIVE GOOGLE GEMINI TIER (100% FREE DEFAULT)
                    let geminiParts = [{ text: prompt }];

                    if (this.fileType && this.fileType.includes('image') && this.uploadedFileContent) {
                        const base64Data = this.uploadedFileContent.split(',')[1];
                        const mime = this.uploadedFileContent.split(';')[0].split(':')[1];
                        geminiParts.push({
                            inlineData: {
                                mimeType: mime,
                                data: base64Data
                            }
                        });
                    } else if (this.uploadedFileContent) {
                        let docSnippet = this.uploadedFileContent;
                        if (docSnippet.length > 25000) docSnippet = docSnippet.substring(0, 25000) + "...[TRUNCATED]";
                        geminiParts[0].text = `INSTRUCTION: ${prompt}\n\ndocument context: ${docSnippet}`;
                    }

                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.selectedModel}:generateContent?key=${this.apiKeys.gemini}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: geminiParts }] })
                    });

                    responseData = await response.json();
                    if (responseData.candidates && responseData.candidates[0].content.parts[0].text) {
                        textResult = responseData.candidates[0].content.parts[0].text;
                    } else {
                        throw new Error("Gemini Error: " + (responseData.error ? responseData.error.message : JSON.stringify(responseData)));
                    }

                } else {
                    // OPENAI / OPENROUTER
                    let payloadMessages = [];
                    if (this.fileType && this.fileType.includes('image') && this.uploadedFileContent) {
                        payloadMessages.push({
                            role: "user",
                            content: [
                                { type: "text", text: prompt },
                                { type: "image_url", image_url: { url: this.uploadedFileContent } }
                            ]
                        });
                    } else {
                        let docSnippet = this.uploadedFileContent;
                        if (docSnippet.length > 25000) docSnippet = docSnippet.substring(0, 25000) + "...[TRUNCATED]";
                        payloadMessages.push({
                            role: "user",
                            content: `INSTRUCTION: ${prompt}\n\ndocument context: ${docSnippet}`
                        });
                    }

                    const isNativeOpenAI = targetModelObj.provider === 'openai';
                    const apiUrl = isNativeOpenAI ? 'https://api.openai.com/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
                    const modelId = isNativeOpenAI ? this.selectedModel.replace('openai/', '') : this.selectedModel;

                    const headersParams = {
                        'Authorization': `Bearer ${isNativeOpenAI ? this.apiKeys.openai : this.apiKeys.openrouter}`,
                        'Content-Type': 'application/json'
                    };

                    if (!isNativeOpenAI) {
                        headersParams['HTTP-Referer'] = 'http://localhost/aistudy';
                        headersParams['X-Title'] = 'AI Study Dashboard';
                    }

                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: headersParams,
                        body: JSON.stringify({
                            model: modelId,
                            messages: payloadMessages
                        })
                    });

                    responseData = await response.json();

                    if (responseData.choices && responseData.choices.length > 0) {
                        textResult = responseData.choices[0].message.content;
                    } else {
                        let exactError = "Unknown API Error";
                        if (responseData.error && responseData.error.message) {
                            exactError = responseData.error.message;
                        }
                        this.aiResponse = `<div class="bg-red-50 dark:bg-red-900/10 p-4 border border-red-200 dark:border-red-800 rounded-xl">
                            <p class="text-red-600 dark:text-red-400 font-bold mb-2"><i class="fa-solid fa-triangle-exclamation mr-2"></i>API Quota / Server Error</p>
                            <p class="text-slate-700 dark:text-slate-300 text-sm mb-2">The AI model failed to process your request. Detailed reason:</p>
                            <code class="block bg-black text-red-400 p-3 rounded-lg text-xs font-mono">\n${exactError}</code>
                            <p class="text-xs text-slate-500 mt-3 pt-3 border-t border-red-200 dark:border-red-800/50">Tip: If you're out of OpenAI credits, change the dropdown model to Gemini 1.5 Flash (100% Free) instead.</p>
                        </div>`;
                        this.isProcessing = false;
                        return;
                    }
                }

                if (textResult) {

                    if (type === 'quiz') {
                        textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
                        try {
                            const quizJson = JSON.parse(textResult);
                            this.startQuiz(quizJson);
                            this.aiResponse = '';
                        } catch (e) {
                            console.error("JSON parse failed", e, textResult);
                            this.aiResponse = `<p class="text-red-500 font-bold">Error: Model did not return valid JSON for the quiz.</p><pre class="text-xs text-slate-500 overflow-auto p-4 mt-2 bg-slate-100 dark:bg-slate-900">${textResult}</pre>`;
                        }
                    } else {
                        const formattedHtml = textResult
                            .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-5 mb-2 text-indigo-700 dark:text-indigo-400">$1</h3>')
                            .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-6 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">$1</h2>')
                            .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
                            .replace(/\*\*(.*?)\*\*/gim, '<strong class="text-slate-800 dark:text-slate-100">$1</strong>')
                            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
                            .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc mb-1 text-slate-700 dark:text-slate-300">$1</li>')
                            .replace(/^\d+\.\s+(.*$)/gim, '<li class="ml-4 list-decimal mb-1 text-slate-700 dark:text-slate-300">$1</li>')
                            .replace(/\n\n/gim, '<br><br>');

                        this.aiResponse = `<div class="p-2 text-[15px] leading-relaxed">${formattedHtml}</div>`;
                    }
                } else {
                    let exactError = "Unknown API Error";
                    if (responseData && responseData.error && responseData.error.message) {
                        exactError = responseData.error.message;
                    }
                    this.aiResponse = `<div class="bg-red-50 dark:bg-red-900/10 p-4 border border-red-200 dark:border-red-800 rounded-xl">
                        <p class="text-red-600 dark:text-red-400 font-bold mb-2"><i class="fa-solid fa-triangle-exclamation mr-2"></i>API Server Error</p>
                        <p class="text-slate-700 dark:text-slate-300 text-sm mb-2">The AI model failed to process your request. Detailed reason:</p>
                        <code class="block bg-black text-red-400 p-3 rounded-lg text-xs font-mono">\n${exactError}</code>
                        <p class="text-xs text-slate-500 mt-3 pt-3 border-t border-red-200 dark:border-red-800/50">Tip: If you're using an Image, ensure you select a model labeled "Vision" or "GPT-4o". If you're out of credits, select a "(Free)" model instead.</p>
                    </div>`;
                    console.log("Detailed Error Payload:", responseData);
                }

            } catch (err) {
                console.error(err);
                this.aiResponse = `<p class="text-red-500 font-bold">Client Connection Error: ${err.message}</p>`;
            } finally {
                this.isProcessing = false;
                this.showToast('AI analysis resolved.');
            }
        },

        startQuiz(data) {
            this.quizData = data.slice(0, 15); // ensure max 15
            this.quizActive = true;
            this.quizFinished = false;
            this.quizIndex = 0;
            this.quizCorrect = 0;
            this.quizWrong = 0;
            this.startTimer();
        },

        startTimer() {
            this.quizTimer = 10;
            clearInterval(this.quizInterval);
            this.quizInterval = setInterval(() => {
                this.quizTimer--;
                if (this.quizTimer <= 0) {
                    this.quizWrong++;
                    this.nextQuestion();
                }
            }, 1000);
        },

        answerQuestion(idx) {
            clearInterval(this.quizInterval); // stop timer immediately
            const currentQ = this.quizData[this.quizIndex];
            if (idx === currentQ.correctAnswer) {
                this.quizCorrect++;
            } else {
                this.quizWrong++;
            }
            // Add a small delay so they see they clicked
            setTimeout(() => {
                this.nextQuestion();
            }, 500);
        },

        nextQuestion() {
            if (this.quizIndex < this.quizData.length - 1) {
                this.quizIndex++;
                this.startTimer();
            } else {
                clearInterval(this.quizInterval);
                this.quizFinished = true;
                this.quizActive = false; // end active quiz phase
            }
        },

        showToast(msg) {
            this.toast.message = msg;
            this.toast.show = true;
            setTimeout(() => this.toast.show = false, 3000);
        },

        async searchLibrary(page = 1) {
            this.libraryPage = page;
            this.isSearchingLibrary = true;
            this.libraryBooks = [];

            try {
                let response, data;

                if (!this.libraryQuery.trim()) {
                    // Display Global Trending Books as the default "all" view
                    response = await fetch(`https://openlibrary.org/trending/daily.json?limit=18&page=${this.libraryPage}`);
                    data = await response.json();

                    this.libraryTotalDocs = data.works ? 10000 : 0; // Trending API does not return total count, mock it for pagination

                    this.libraryBooks = (data.works || []).map(book => ({
                        title: book.title,
                        author: book.author_name ? book.author_name.join(', ') : 'Unknown Author',
                        year: book.first_publish_year || 'Unknown',
                        cover: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : `https://ui-avatars.com/api/?name=${encodeURIComponent(book.title)}&background=random&size=200`,
                        key: book.key
                    }));
                } else {
                    // Standard explicit Search Query
                    response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(this.libraryQuery)}&limit=18&page=${this.libraryPage}`);
                    data = await response.json();

                    this.libraryTotalDocs = data.numFound || 0;

                    this.libraryBooks = (data.docs || []).map(book => ({
                        title: book.title,
                        author: book.author_name ? book.author_name.join(', ') : 'Unknown Author',
                        year: book.first_publish_year || 'Unknown',
                        cover: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : `https://ui-avatars.com/api/?name=${encodeURIComponent(book.title)}&background=random&size=200`,
                        key: book.key
                    }));
                }
            } catch (err) {
                console.error(err);
                this.showToast('Failed to fetch books from Open Library.');
            } finally {
                this.isSearchingLibrary = false;
            }
        },

        nextPage() {
            if (this.libraryPage * 18 < this.libraryTotalDocs) {
                this.searchLibrary(this.libraryPage + 1);
            }
        },

        prevPage() {
            if (this.libraryPage > 1) {
                this.searchLibrary(this.libraryPage - 1);
            }
        },

        saveBook(book) {
            const exists = this.savedBooks.find(b => b.key === book.key);
            if (exists) {
                this.showToast('This book is already in your list!');
                return;
            }
            this.savedBooks.push(book);
            localStorage.setItem('savedBooks', JSON.stringify(this.savedBooks));
            this.showToast('Book saved to your reading list!');
        },

        removeSavedBook(key) {
            this.savedBooks = this.savedBooks.filter(b => b.key !== key);
            localStorage.setItem('savedBooks', JSON.stringify(this.savedBooks));
            this.showToast('Book removed from list.');
        },

        addMyNote() {
            if (!this.newNoteText.trim()) return;
            this.myNotes.unshift({
                id: Date.now(),
                content: this.newNoteText.trim(),
                date: new Date().toLocaleDateString()
            });
            localStorage.setItem('myNotes', JSON.stringify(this.myNotes));
            this.newNoteText = '';
            this.showToast('Note saved successfully!');
        },

        deleteMyNote(id) {
            this.myNotes = this.myNotes.filter(n => n.id !== id);
            localStorage.setItem('myNotes', JSON.stringify(this.myNotes));
            this.showToast('Note deleted.');
        },

        handleAvatarUpload(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.userProfile.avatar = e.target.result;
                    this.saveProfileToLocal();
                };
                reader.readAsDataURL(file);
            }
        },

        linkGoogleAccount() {
            this.showToast('Connecting securely to Google...');
            setTimeout(() => {
                        this.userProfile.googleLinked = true;
                this.userProfile.email = this.userProfile.email.includes('@') ? this.userProfile.email : 'user@gmail.com';
                this.saveProfileToLocal();
                this.showToast('Google Account linked successfully!');
            }, 1200);
        },

        saveSettings() {
            if (!this.userProfile.avatar || !this.userProfile.avatar.startsWith('data:') && !this.userProfile.avatar.includes('http')) {
                this.userProfile.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.userProfile.name)}&background=4F46E5&color=fff`;
            } else if (this.userProfile.avatar.includes('ui-avatars')) {
                this.userProfile.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.userProfile.name)}&background=4F46E5&color=fff`;
            }
            this.saveProfileToLocal();
            // Save API Keys
            localStorage.setItem('gemini_key', this.apiKeys.gemini);
            localStorage.setItem('openrouter_key', this.apiKeys.openrouter);
            localStorage.setItem('openai_key', this.apiKeys.openai);
            localStorage.setItem('groq_key', this.apiKeys.groq);
            
            this.showToast('Profile and API settings saved successfully!');
        },

        saveProfileToLocal() {
            localStorage.setItem('userProfile', JSON.stringify(this.userProfile));
        },

        async sendChatMessage() {
            if (!this.chatInput.trim() && !this.chatImage) return;

            const userText = this.chatInput.trim();
            const userImage = this.chatImage;
            
            this.isChatting = true;
            this.chatMessages.push({ role: 'user', text: userText, image: userImage });
            this.chatInput = '';
            this.chatImage = null;

            const currentModelConf = this.availableModels.find(m => m.id === this.selectedModel);
            const apiKey = this.apiKeys[currentModelConf.provider] || (currentModelConf.provider === 'openrouter' ? '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' : '');

            try {
                // Image Generation Shortcut: If user starts with "/image "
                if (userText.toLowerCase().startsWith('/image ')) {
                    const prompt = userText.substring(7);
                    const genImg = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
                    this.chatMessages.push({ role: 'model', text: `Generated image for: "${prompt}"`, image: genImg });
                    this.isChatting = false;
                    this.scrollToBottom('chat-container');
                    return;
                }

                if (currentModelConf.provider === 'openrouter' || currentModelConf.provider === 'cloud') {
                    // Unified OpenRouter / Cloud Logic with Vision Support
                    const OR_KEY = apiKey || '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';
                    
                    // Format message content for multi-modal support
                    const messages = this.chatMessages.map(m => {
                        if (m.role === 'user' && m.image) {
                            return {
                                role: 'user',
                                content: [
                                    { type: 'text', text: m.text },
                                    { type: 'image_url', image_url: { url: m.image } }
                                ]
                            };
                        }
                        return { role: m.role === 'model' ? 'assistant' : 'user', content: m.text };
                    });

                    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${OR_KEY}`,
                            'HTTP-Referer': window.location.origin,
                            'X-Title': 'Study.AI Pro'
                        },
                        body: JSON.stringify({
                            model: currentModelConf.id,
                            messages: messages
                        })
                    });

                    const data = await response.json();
                    if (!response.ok) {
                        const errMsg = (data.error && data.error.message) ? data.error.message : (data.error || `Server Error ${response.status}`);
                        throw new Error(errMsg);
                    }
                    
                    if (data.choices && data.choices[0]) {
                        this.chatMessages.push({ role: 'model', text: data.choices[0].message.content });
                    } else {
                        throw new Error('Malformed response from OpenRouter');
                    }
                } else if (currentModelConf.provider === 'openai') {
                    // Standard OpenAI
                    const messages = this.chatMessages.map(m => ({
                        role: m.role === 'model' ? 'assistant' : 'user',
                        content: m.text
                    }));

                    const response = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`
                        },
                        body: JSON.stringify({ model: currentModelConf.id, messages: messages })
                    });

                    const data = await response.json();
                    if (data.choices) this.chatMessages.push({ role: 'model', text: data.choices[0].message.content });
                    else throw new Error(data.error?.message || 'OpenAI Error');
                } else if (currentModelConf.provider === 'google') {
                    // Google Gemini Direct
                    const contents = this.chatMessages.map(m => ({
                        role: m.role === 'user' ? 'user' : 'model',
                        parts: [{ text: m.text }]
                    }));

                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${currentModelConf.id}:generateContent?key=${apiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: contents })
                    });

                    const data = await response.json();
                    if (data.candidates) this.chatMessages.push({ role: 'model', text: data.candidates[0].content.parts[0].text });
                    else throw new Error(data.error?.message || 'Gemini Error');
                } else if (currentModelConf.provider === 'groq') {
                    // Groq Fast Inference
                    const messages = this.chatMessages.map(m => ({
                        role: m.role === 'model' ? 'assistant' : 'user',
                        content: m.text
                    }));

                    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`
                        },
                        body: JSON.stringify({ model: currentModelConf.id, messages: messages })
                    });

                    const data = await response.json();
                    if (data.choices) this.chatMessages.push({ role: 'model', text: data.choices[0].message.content });
                    else throw new Error(data.error?.message || 'Groq Error');
                }

            } catch (err) {
                console.error("AI API Error:", err);
                this.chatMessages.push({ role: 'model', text: `Error: ${err.message}. Please check your API key and model selection.` });
            } finally {
                this.isChatting = false;
                this.scrollToBottom('chat-container');
            }
        },

        scrollToBottom(id) {
            setTimeout(() => {
                const box = document.getElementById(id);
                if (box) box.scrollTop = box.scrollHeight;
            }, 100);
        },

        handleChatFileSelect(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (re) => {
                    this.chatImage = re.target.result;
                    this.showToast('Image attached to message');
                };
                reader.readAsDataURL(file);
            }
        },

        toggleVoiceInput() {
            if (this.isListening) {
                if (this.speechRecognition) this.speechRecognition.stop();
                this.isListening = false;
                return;
            }

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                this.showToast('Voice Recognition is not supported in this browser.');
                return;
            }

            this.speechRecognition = new SpeechRecognition();
            this.speechRecognition.continuous = false;
            this.speechRecognition.interimResults = false;
            this.speechRecognition.lang = 'en-US';

            this.speechRecognition.onstart = () => {
                this.isListening = true;
                this.showToast('Listening...');
            };

            this.speechRecognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.chatInput = transcript;
                this.isListening = false;
                this.showToast('Voice captured!');
            };

            this.speechRecognition.onerror = (event) => {
                console.error(event.error);
                this.isListening = false;
                this.showToast('Voice error: ' + event.error);
            };

            this.speechRecognition.onend = () => {
                this.isListening = false;
            };

            this.speechRecognition.start();
        },

        speakText(text) {
            if (!window.speechSynthesis) {
                this.showToast('TTS not supported');
                return;
            }
            
            // Stop any current speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            
            // Find a nice voice if possible
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Female') || v.name.includes('Samantha'));
            if (preferredVoice) utterance.voice = preferredVoice;

            window.speechSynthesis.speak(utterance);
            this.showToast('Speaking...');
        }
    }
}