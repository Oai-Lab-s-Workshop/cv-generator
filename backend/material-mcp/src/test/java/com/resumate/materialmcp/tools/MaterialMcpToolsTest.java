package com.resumate.materialmcp.tools;

import com.resumate.materialmcp.config.FrontendProperties;
import com.resumate.materialmcp.dto.MaterialRequest;
import com.resumate.materialmcp.service.MaterialPocketBaseClient;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class MaterialMcpToolsTest {

    @Mock
    private MaterialPocketBaseClient pocketBaseClient;

    @Mock
    private FrontendProperties frontendProperties;

    @InjectMocks
    private MaterialMcpTools materialMcpTools;

    @Test
    void createJob_shouldRejectMissingUserConfirmation() {
        // Arrange
        MaterialRequest.JobData jobData = new MaterialRequest.JobData(
                "Software Engineer",
                "Tech Corp",
                "2020-01-01",
                "2023-12-31",
                "Developed web applications",
                "Backend development",
                "San Francisco",
                "Java, Spring"
        );
        
        MaterialRequest.CreateJobRequest request = new MaterialRequest.CreateJobRequest(
                "user123",
                jobData,
                false // Missing confirmation
        );
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> materialMcpTools.createJob(request));
        
        assertEquals("User confirmation is required to create job. Set userConfirmed=true.", 
                exception.getMessage());
    }

    @Test
    void createJob_shouldRejectJobListingReferences() {
        // Arrange
        MaterialRequest.JobData jobData = new MaterialRequest.JobData(
                "Job tailored to job listing", // Contains job-listing reference
                "Tech Corp",
                "2020-01-01",
                "2023-12-31",
                "Developed web applications",
                "Backend development",
                "San Francisco",
                "Java, Spring"
        );
        
        MaterialRequest.CreateJobRequest request = new MaterialRequest.CreateJobRequest(
                "user123",
                jobData,
                true
        );
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> materialMcpTools.createJob(request));
        
        assertEquals("Create material tailored to job listings is not allowed. Create authentic job based on your actual experience.", 
                exception.getMessage());
    }
}