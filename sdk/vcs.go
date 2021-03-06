package sdk

import (
	"io"
	"time"
)

type VCSServer interface {
	AuthorizeRedirect() (string, string, error)
	AuthorizeToken(string, string) (string, string, error)
	GetAuthorizedClient(string, string) (VCSAuthorizedClient, error)
}

type VCSAuthorizedClient interface {
	//Repos
	Repos() ([]VCSRepo, error)
	RepoByFullname(fullname string) (VCSRepo, error)

	//Branches
	Branches(string) ([]VCSBranch, error)
	Branch(string, string) (*VCSBranch, error)

	//Commits
	Commits(repo, branch, since, until string) ([]VCSCommit, error)
	Commit(repo, hash string) (VCSCommit, error)

	// PullRequests
	PullRequests(string) ([]VCSPullRequest, error)

	//Hooks
	CreateHook(repo string, hook VCSHook) error
	GetHook(repo, url string) (VCSHook, error)
	UpdateHook(repo, url string, hook VCSHook) error
	DeleteHook(repo string, hook VCSHook) error

	//Events
	GetEvents(repo string, dateRef time.Time) ([]interface{}, time.Duration, error)
	PushEvents(string, []interface{}) ([]VCSPushEvent, error)
	CreateEvents(string, []interface{}) ([]VCSCreateEvent, error)
	DeleteEvents(string, []interface{}) ([]VCSDeleteEvent, error)
	PullRequestEvents(string, []interface{}) ([]VCSPullRequestEvent, error)

	// Set build status on repository
	SetStatus(event Event) error

	// Release
	Release(repo, tagName, releaseTitle, releaseDescription string) (*VCSRelease, error)
	UploadReleaseFile(repo string, releaseName string, uploadURL string, artifactName string, r io.ReadCloser) error
}
