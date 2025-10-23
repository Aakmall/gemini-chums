pipeline {
  agent any
  options {
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: "20"))
  }

  triggers {
    githubPush()
    pollSCM("H/5 * * * *")
  }

  environment {
    APP_DIR = "."
    DEPLOY_DIR = "/home/groupfox/public_html"
  }

  stages {
    stage("Checkout") {
      steps { checkout scm }
    }

    stage("Generate .env") {
      steps {
        withCredentials([
          string(credentialsId: "VITE_SUPABASE_URL",             variable: "SUPA_URL"),
          string(credentialsId: "VITE_SUPABASE_PUBLISHABLE_KEY", variable: "SUPA_KEY"),
          string(credentialsId: "VITE_GEMINI_API_KEY",           variable: "GEMINI_KEY"),
          string(credentialsId: "VITE_GEMINI_MODEL",             variable: "GEMINI_MODEL")
        ]) {
          sh '''
cat > .env <<EOF
VITE_SUPABASE_URL="\${SUPA_URL}"
VITE_SUPABASE_PUBLISHABLE_KEY="\${SUPA_KEY}"
VITE_GEMINI_API_KEY="\${GEMINI_KEY}"
VITE_GEMINI_MODEL="\${GEMINI_MODEL:-gemini-1.5-flash}"
EOF
'''
        }
      }
    }

    stage("Install Dependencies") {
      steps { sh "npm ci" }
    }

    stage("Build App") {
      steps { sh "npm run build" }
    }

    stage("Deploy") {
      steps { sh "rsync -av --delete \${APP_DIR}/dist/ \${DEPLOY_DIR}/" }
    }
  }

  post {
    success { echo "✅ DEPLOY OK — Cek http://103.217.144.99:8081" }
    failure { echo "❌ BUILD/DEPLOY GAGAL — Cek log di Jenkins" }
  }
}