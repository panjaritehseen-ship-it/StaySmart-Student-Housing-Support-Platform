pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 10, unit: 'MINUTES')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Check CI Environment') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    $nodeVersion = node --version
                    if ($LASTEXITCODE -ne 0) {
                        throw "Node.js is required on the Jenkins agent."
                    }

                    if ($nodeVersion -notmatch '^v(\\d+)\\.') {
                        throw "Could not parse Node.js version: $nodeVersion"
                    }

                    $nodeMajor = [int]$Matches[1]
                    if ($nodeMajor -lt 18) {
                        throw "Node.js 18 or newer is required. Found: $nodeVersion"
                    }

                    Write-Host "Using Node.js $nodeVersion"
                '''
            }
        }

        stage('Verify Project Files') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    $requiredFiles = @(
                        "index.html",
                        "vendor.html",
                        "admin.html",
                        "css/style.css",
                        "js/data.js",
                        "js/panel.js",
                        "js/app.js",
                        "js/vendor.js",
                        "js/admin.js",
                        "tests/staysmart.test.js",
                        "images/properties/bedroom.jpg"
                    )

                    foreach ($file in $requiredFiles) {
                        if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
                            throw "Missing required project file: $file"
                        }

                        Write-Host "Verified: $file"
                    }
                '''
            }
        }

        stage('JavaScript Syntax Checks') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    $jsFiles = @(
                        "js/data.js",
                        "js/panel.js",
                        "js/app.js",
                        "js/vendor.js",
                        "js/admin.js",
                        "tests/staysmart.test.js"
                    )

                    foreach ($file in $jsFiles) {
                        Write-Host "Checking JavaScript syntax: $file"
                        node --check $file

                        if ($LASTEXITCODE -ne 0) {
                            throw "JavaScript syntax check failed: $file"
                        }
                    }

                    Write-Host "All JavaScript files passed syntax checks."
                '''
            }
        }

        stage('Automated Application Tests') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    Write-Host "Running StaySmart automated tests..."
                    node tests/staysmart.test.js

                    if ($LASTEXITCODE -ne 0) {
                        throw "StaySmart automated tests failed."
                    }
                '''
            }
        }

        
        stage('Docker Build') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    docker build -t staysmart:1.0 .

                    if ($LASTEXITCODE -ne 0) {
                        throw "Docker image build failed."
                    }

                    Write-Output "Docker image built successfully."
                '''
            }
        }

        stage('Docker Deploy') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    # Remove the old container if it exists
                    $existing = docker ps -aq --filter "name=^/staysmart$"

                    if ($LASTEXITCODE -ne 0) {
                        throw "Unable to check existing containers."
                    }

                    if ($existing) {
                        docker rm -f staysmart

                        if ($LASTEXITCODE -ne 0) {
                            throw "Could not remove the old container."
                        }
                    }

                    # Run the new container
                    docker run -d --name staysmart -p 8080:80 staysmart:1.0

                    if ($LASTEXITCODE -ne 0) {
                        throw "Docker deployment failed."
                    }

                    Write-Output "StaySmart deployed on port 8080."
                '''
            }
        }

    }

    
    post {
        success {
            echo 'StaySmart CI: all checks and automated tests passed.'
        }

        failure {
            echo 'StaySmart CI: a check or automated test failed. See the stage logs.'
        }

        always {
            echo 'StaySmart CI: pipeline execution completed.'
        }
    }
}
